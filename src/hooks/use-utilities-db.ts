import { useState, useEffect, useCallback } from 'react';
import Dexie from 'dexie/dist/dexie.mjs';
import { db, seedIfEmpty, type DbCurrentMonth } from '@/lib/db';
import { type UtilityType, UTILITIES } from '@/types/utility';
import { spaces, clients } from '@/data/mockData';
import { toast } from 'sonner';

export interface CurrentMonthRow {
  id: string;
  dbId?: number;
  spaceId: string;
  spaceName: string;
  clientId: string;
  clientName: string;
  utilityType: UtilityType;
  utilityName: string;
  unit: string;
  hasMeter: boolean;
  indexOld: number;
  indexNew: number;
  constant: number;
  isp: number;
  csp: number;
  consumption: number;
  netValue: number;
  vatValue: number;
  totalValue: number;
  isInitialized: boolean;
}

export interface HistoryRow {
  id: number;
  spaceId: string;
  spaceName: string;
  clientId: string;
  clientName: string;
  utilityType: UtilityType;
  utilityName: string;
  consumption: number;
  unit: string;
  netValue: number;
  vatValue: number;
  totalValue: number;
}

function calculateConsumption(utilityType: UtilityType, indexOld: number, indexNew: number, constant: number, isp?: number, csp?: number): number {
  const utility = UTILITIES.find(u => u.id === utilityType);
  if (utility && !utility.hasMeter) {
    // Non-metered service: Isp * Csp
    return (isp || 0) * (csp || 0);
  }
  const diff = Math.max(0, indexNew - indexOld);
  switch (utilityType) {
    case 'EE': return diff * constant;
    case 'GN': return diff * constant;
    case 'AC': return diff;
    default: return diff * constant;
  }
}

export function useUtilitiesDb() {
  const [ready, setReady] = useState(false);
  const [historicalPeriods, setHistoricalPeriods] = useState<string[]>([]);
  const [currentMonthData, setCurrentMonthData] = useState<CurrentMonthRow[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState('');

  // Init DB and seed
  useEffect(() => {
    seedIfEmpty().then(async () => {
      // Load distinct periods from distributions
      const dists = await db.distributions.toArray();
      const readings = await db.meterReadings.toArray();
      const periods = new Set<string>();
      dists.forEach(d => periods.add(d.period));
      readings.forEach(r => periods.add(r.period));
      const sorted = Array.from(periods).sort().reverse();
      setHistoricalPeriods(sorted);

      // Set current period as next after last historical
      if (sorted.length > 0) {
        const [y, m] = sorted[0].split('-').map(Number);
        const nm = m === 12 ? 1 : m + 1;
        const ny = m === 12 ? y + 1 : y;
        const next = `${ny}-${String(nm).padStart(2, '0')}`;
        setCurrentPeriod(next);

        // Check if current month data exists in DB
        const existing = await db.currentMonth.where('period').equals(next).toArray();
        if (existing.length > 0) {
          setCurrentMonthData(existing.map(mapDbToRow));
          setIsInitialized(true);
        }
      }
      setReady(true);
    });
  }, []);

  function mapDbToRow(rec: DbCurrentMonth): CurrentMonthRow {
    const space = spaces.find(s => s.id === rec.spaceId);
    const client = clients.find(c => c.id === rec.clientId);
    const utility = UTILITIES.find(u => u.id === rec.utilityType);
    return {
      id: `CM-${rec.spaceId}-${rec.utilityType}`,
      dbId: rec.id,
      spaceId: rec.spaceId,
      spaceName: space?.name || 'Necunoscut',
      clientId: rec.clientId,
      clientName: client?.name || 'Necunoscut',
      utilityType: rec.utilityType,
      utilityName: utility?.fullName || rec.utilityType,
      unit: utility?.unit || '',
      hasMeter: utility?.hasMeter ?? true,
      indexOld: rec.indexOld,
      indexNew: rec.indexNew,
      constant: rec.constant,
      isp: rec.isp ?? 0,
      csp: rec.csp ?? 0,
      consumption: rec.consumption,
      netValue: rec.netValue,
      vatValue: rec.vatValue,
      totalValue: rec.totalValue,
      isInitialized: true,
    };
  }

  const getHistoryData = useCallback(async (period: string, utilityFilter: string): Promise<HistoryRow[]> => {
    let dists = await db.distributions.where('period').equals(period).toArray();
    if (utilityFilter !== 'all') {
      dists = dists.filter(d => d.utilityType === utilityFilter);
    }
    return dists.map(d => {
      const space = spaces.find(s => s.id === d.spaceId);
      const client = clients.find(c => c.id === d.clientId);
      const utility = UTILITIES.find(u => u.id === d.utilityType);
      return {
        id: d.id!,
        spaceId: d.spaceId,
        spaceName: space?.name || 'Necunoscut',
        clientId: d.clientId,
        clientName: client?.name || 'Necunoscut',
        utilityType: d.utilityType as UtilityType,
        utilityName: utility?.fullName || d.utilityType,
        consumption: d.consumption,
        unit: utility?.unit || '',
        netValue: d.netValue,
        vatValue: d.vatValue,
        totalValue: d.totalValue,
      };
    });
  }, []);

  const initializeConsumption = useCallback(async (period: string, utilityFilter: string) => {
    const occupiedSpaces = spaces.filter(s => s.clientId !== null);
    const utilities = utilityFilter === 'all'
      ? UTILITIES
      : UTILITIES.filter(u => u.id === utilityFilter);

    const records: DbCurrentMonth[] = [];

    for (const space of occupiedSpaces) {
      for (const utility of utilities) {
        if (utility.hasMeter) {
          // Metered utility: get last reading from DB
          const lastReadings = await db.meterReadings
            .where('[spaceId+utilityType+period]')
            .between([space.id, utility.id, Dexie.minKey], [space.id, utility.id, Dexie.maxKey])
            .toArray();
          const lastReading = lastReadings.sort((a, b) => b.period.localeCompare(a.period))[0];

          records.push({
            spaceId: space.id,
            clientId: space.clientId!,
            utilityType: utility.id,
            period,
            indexOld: lastReading?.indexNew || 0,
            indexNew: 0,
            constant: lastReading?.constant || (utility.id === 'GN' ? lastReading?.pcs || 10.94 : 1),
            isp: 0,
            csp: 0,
            consumption: 0,
            netValue: 0,
            vatValue: 0,
            totalValue: 0,
          });
        } else {
          // Non-metered service: use Isp * Csp
          // Default Isp based on service type
          let defaultIsp = 1;
          if (utility.id === 'SM' || utility.id === 'SSV') {
            defaultIsp = space.area; // suprafață (mp)
          } else if (utility.id === 'AA' || utility.id === 'AS') {
            defaultIsp = space.persons; // nr persoane
          }

          records.push({
            spaceId: space.id,
            clientId: space.clientId!,
            utilityType: utility.id,
            period,
            indexOld: 0,
            indexNew: 0,
            constant: 0,
            isp: defaultIsp,
            csp: 0,
            consumption: 0,
            netValue: 0,
            vatValue: 0,
            totalValue: 0,
          });
        }
      }
    }

    // Clear existing for this period and save
    await db.currentMonth.where('period').equals(period).delete();
    await db.currentMonth.bulkAdd(records);

    const saved = await db.currentMonth.where('period').equals(period).toArray();
    setCurrentMonthData(saved.map(mapDbToRow));
    setIsInitialized(true);
    toast.success('Consumul a fost inițializat și salvat!');
  }, []);

  const updateReading = useCallback(async (
    rowId: string,
    dbId: number,
    indexOld: number,
    indexNew: number,
    constant: number,
    utilityType: UtilityType,
    isp?: number,
    csp?: number
  ) => {
    const consumption = calculateConsumption(utilityType, indexOld, indexNew, constant, isp, csp);
    const utility = UTILITIES.find(u => u.id === utilityType);
    if (utility && !utility.hasMeter) {
      await db.currentMonth.update(dbId, { isp: isp || 0, csp: csp || 0, consumption });
      setCurrentMonthData(prev => prev.map(item =>
        item.id === rowId
          ? { ...item, isp: isp || 0, csp: csp || 0, consumption }
          : item
      ));
    } else {
      await db.currentMonth.update(dbId, { indexOld, indexNew, constant, consumption });
      setCurrentMonthData(prev => prev.map(item =>
        item.id === rowId
          ? { ...item, indexOld, indexNew, constant, consumption }
          : item
      ));
    }
    toast.success('Datele au fost salvate!');
  }, []);

  const recalculateValues = useCallback(async (data: CurrentMonthRow[], period: string): Promise<CurrentMonthRow[]> => {
    // Read invoices from Dexie DB
    const invoices = await db.supplierInvoices.where('period').equals(period).toArray();

    return data.map(item => {
      const invoice = invoices.find(
        inv => inv.utilityType === item.utilityType
      );
      const totalConsumption = data
        .filter(d => d.utilityType === item.utilityType)
        .reduce((sum, d) => sum + d.consumption, 0);

      let netValue = 0, vatValue = 0, totalValue = 0;
      if (invoice && totalConsumption > 0) {
        const proportion = item.consumption / totalConsumption;
        netValue = invoice.netValue * proportion;
        vatValue = invoice.vatValue * proportion;
        totalValue = invoice.totalValue * proportion;
      }
      return { ...item, netValue, vatValue, totalValue };
    });
  }, []);

  const closePeriod = useCallback(async (
    period: string,
    serviceOverrides?: {
      spaceId: string;
      clientId: string;
      utilityType: UtilityType;
      consumption: number;
      netValue: number;
      vatValue: number;
      totalValue: number;
    }[]
  ): Promise<boolean> => {
    const currentData = await db.currentMonth.where('period').equals(period).toArray();
    if (currentData.length === 0) {
      toast.error('Nu există date pentru această perioadă!');
      return false;
    }

    // Recalculate values before closing
    const rows = currentData.map(mapDbToRow);
    const withValues = await recalculateValues(rows, period);

    // Save meter readings to history (only metered utilities)
    const meteredRows = withValues.filter(r => r.hasMeter);
    if (meteredRows.length > 0) {
      await db.meterReadings.bulkAdd(
        meteredRows.map(r => ({
          spaceId: r.spaceId,
          utilityType: r.utilityType,
          period,
          indexOld: r.indexOld,
          indexNew: r.indexNew,
          constant: r.constant,
          consumption: r.consumption,
        }))
      );
    }

    // Build distributions: use service overrides for AC/AA/AS/SM/SSV/SC, recalculated for EE/GN
    const serviceTypes: UtilityType[] = ['AC', 'AA', 'AS', 'SM', 'SSV', 'SC'];
    const overrideSet = new Set(serviceOverrides?.map(o => `${o.spaceId}-${o.utilityType}`) || []);

    const standardDists = withValues
      .filter(r => !serviceTypes.includes(r.utilityType))
      .map(r => ({
        spaceId: r.spaceId,
        clientId: r.clientId,
        utilityType: r.utilityType,
        period,
        consumption: r.consumption,
        netValue: r.netValue,
        vatValue: r.vatValue,
        totalValue: r.totalValue,
        distributionMethod: 'meter' as string,
      }));

    const serviceDists = (serviceOverrides || []).map(o => ({
      spaceId: o.spaceId,
      clientId: o.clientId,
      utilityType: o.utilityType,
      period,
      consumption: o.consumption,
      netValue: o.netValue,
      vatValue: o.vatValue,
      totalValue: o.totalValue,
      distributionMethod: 'proportional' as string,
    }));

    // Save distributions to history
    await db.distributions.bulkAdd([...standardDists, ...serviceDists]);

    // Clear current month
    await db.currentMonth.where('period').equals(period).delete();

    // Update state
    setHistoricalPeriods(prev => [period, ...prev].sort().reverse());
    setCurrentMonthData([]);
    setIsInitialized(false);

    // Advance to next period
    const [y, m] = period.split('-').map(Number);
    const nm = m === 12 ? 1 : m + 1;
    const ny = m === 12 ? y + 1 : y;
    setCurrentPeriod(`${ny}-${String(nm).padStart(2, '0')}`);

    toast.success(`Perioada ${period} a fost închisă și transferată în istoric!`);
    return true;
  }, [recalculateValues]);

  const loadPeriodData = useCallback(async (period: string) => {
    const existing = await db.currentMonth.where('period').equals(period).toArray();
    if (existing.length > 0) {
      setCurrentMonthData(existing.map(mapDbToRow));
      setIsInitialized(true);
    } else {
      setCurrentMonthData([]);
      setIsInitialized(false);
    }
  }, []);

  const deleteArchivedPeriod = useCallback(async (period: string): Promise<boolean> => {
    try {
      // Delete distributions for this period
      await db.distributions.where('period').equals(period).delete();
      // Delete meter readings for this period
      await db.meterReadings.where('period').equals(period).delete();
      // Delete confirmed utilities for this period
      await db.confirmedUtilities.where('period').equals(period).delete();
      // Update historical periods
      setHistoricalPeriods(prev => prev.filter(p => p !== period));
      toast.success(`Arhiva pentru ${period} a fost ștearsă! Puteți reinițializa această perioadă în Luna de Consum.`);
      return true;
    } catch (e) {
      toast.error('Eroare la ștergerea arhivei!');
      return false;
    }
  }, []);

  return {
    ready,
    historicalPeriods,
    currentMonthData,
    isInitialized,
    setIsInitialized,
    currentPeriod,
    setCurrentPeriod,
    getHistoryData,
    initializeConsumption,
    updateReading,
    recalculateValues,
    closePeriod,
    loadPeriodData,
  };
}

