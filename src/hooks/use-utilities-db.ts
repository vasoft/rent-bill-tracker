import { useState, useEffect, useCallback } from 'react';
import Dexie from 'dexie';
import { db, seedIfEmpty, type DbCurrentMonth } from '@/lib/db';
import { type UtilityType, UTILITIES } from '@/types/utility';
import { spaces, clients, supplierInvoices } from '@/data/mockData';
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
  indexOld: number;
  indexNew: number;
  constant: number;
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

function calculateConsumption(utilityType: UtilityType, indexOld: number, indexNew: number, constant: number): number {
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
      indexOld: rec.indexOld,
      indexNew: rec.indexNew,
      constant: rec.constant,
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
      ? UTILITIES.filter(u => u.hasMeter)
      : UTILITIES.filter(u => u.id === utilityFilter && u.hasMeter);

    const records: DbCurrentMonth[] = [];

    for (const space of occupiedSpaces) {
      for (const utility of utilities) {
        // Get last reading from DB
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
          indexOld: 0,
          indexNew: 0,
          constant: lastReading?.constant || (utility.id === 'GN' ? lastReading?.pcs || 10.94 : 1),
          consumption: 0,
          netValue: 0,
          vatValue: 0,
          totalValue: 0,
        });
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
    utilityType: UtilityType
  ) => {
    const consumption = calculateConsumption(utilityType, indexOld, indexNew, constant);
    await db.currentMonth.update(dbId, { indexOld, indexNew, constant, consumption });

    setCurrentMonthData(prev => prev.map(item =>
      item.id === rowId
        ? { ...item, indexOld, indexNew, constant, consumption }
        : item
    ));
    toast.success('Indexul a fost salvat!');
  }, []);

  const recalculateValues = useCallback((data: CurrentMonthRow[], period: string): CurrentMonthRow[] => {
    return data.map(item => {
      const invoice = supplierInvoices.find(
        inv => inv.utilityType === item.utilityType && inv.period === period
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

  const closePeriod = useCallback(async (period: string) => {
    const currentData = await db.currentMonth.where('period').equals(period).toArray();
    if (currentData.length === 0) {
      toast.error('Nu există date pentru această perioadă!');
      return;
    }

    // Check all readings have indexNew > 0
    const incomplete = currentData.some(d => d.indexNew === 0);
    if (incomplete) {
      toast.error('Toate indexele noi trebuie completate înainte de închiderea perioadei!');
      return;
    }

    // Recalculate values before closing
    const rows = currentData.map(mapDbToRow);
    const withValues = recalculateValues(rows, period);

    // Save meter readings to history
    await db.meterReadings.bulkAdd(
      withValues.map(r => ({
        spaceId: r.spaceId,
        utilityType: r.utilityType,
        period,
        indexOld: r.indexOld,
        indexNew: r.indexNew,
        constant: r.constant,
        consumption: r.consumption,
      }))
    );

    // Save distributions to history
    await db.distributions.bulkAdd(
      withValues.map(r => ({
        spaceId: r.spaceId,
        clientId: r.clientId,
        utilityType: r.utilityType,
        period,
        consumption: r.consumption,
        netValue: r.netValue,
        vatValue: r.vatValue,
        totalValue: r.totalValue,
        distributionMethod: 'meter',
      }))
    );

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
  }, [recalculateValues]);

  return {
    ready,
    historicalPeriods,
    currentMonthData,
    isInitialized,
    currentPeriod,
    setCurrentPeriod,
    getHistoryData,
    initializeConsumption,
    updateReading,
    recalculateValues,
    closePeriod,
  };
}

