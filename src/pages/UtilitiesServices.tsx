import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Dexie from 'dexie/dist/dexie.mjs';
import AcTable from '@/components/utilities/AcTable';
import AaTable from '@/components/utilities/AaTable';
import AsTable from '@/components/utilities/AsTable';
import SmTable from '@/components/utilities/SmTable';
import SsvTable from '@/components/utilities/SsvTable';
import ScTable from '@/components/utilities/ScTable';
import { useAcDistribution } from '@/hooks/use-ac-distribution';
import { useAaDistribution } from '@/hooks/use-aa-distribution';
import { useAsDistribution } from '@/hooks/use-as-distribution';
import { useSmDistribution } from '@/hooks/use-sm-distribution';
import { useSsvDistribution } from '@/hooks/use-ssv-distribution';
import { useScDistribution } from '@/hooks/use-sc-distribution';
import { db } from '@/lib/db';
import MainLayout from '@/components/layout/MainLayout';
import { UTILITIES, UtilityType } from '@/types/utility';
import { useUtilitiesDb, type CurrentMonthRow, type HistoryRow } from '@/hooks/use-utilities-db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { History, Calendar, Zap, Flame, Droplets, Calculator, Play, Pencil, Lock } from 'lucide-react';
import { toast } from 'sonner';
import SummaryStats, { type SummaryStatsData } from '@/components/utilities/SummaryStats';

const UtilitiesServices = () => {
  const {
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
  } = useUtilitiesDb();

  // AC distribution hook
  const { acSpaceData, acValueData, acSubLines } = useAcDistribution(currentMonthData, currentPeriod);

  // AA distribution hook (depends on A&C data)
  const { aaData: aaDistData } = useAaDistribution(acSpaceData, currentPeriod);
  const [aaData, setAaData] = useState(aaDistData);
  useEffect(() => { setAaData(aaDistData); }, [aaDistData]);

  // AS distribution hook (depends on A&C data - uses alimentareApa as reference)
  const { asData: asDistData } = useAsDistribution(acSpaceData, currentPeriod);
  const [asData, setAsData] = useState(asDistData);
  useEffect(() => { setAsData(asDistData); }, [asDistData]);

  // SM distribution hook (depends on EE values + A&C values)
  const { smData: smDistData } = useSmDistribution(acValueData, currentMonthData, currentPeriod);
  const [smData, setSmData] = useState(smDistData);
  useEffect(() => { setSmData(smDistData); }, [smDistData]);

  // SSV distribution hook (depends on A&C area data)
  const { ssvData: ssvDistData } = useSsvDistribution(acSpaceData, currentPeriod);
  const [ssvData, setSsvData] = useState(ssvDistData);
  useEffect(() => { setSsvData(ssvDistData); }, [ssvDistData]);

  // SC distribution hook (depends on A&C persons data)
  const { scData: scDistData } = useScDistribution(acSpaceData, currentPeriod);
  const [scData, setScData] = useState(scDistData);
  useEffect(() => { setScData(scDistData); }, [scDistData]);

  // Filters
  const [historyUtilityFilter, setHistoryUtilityFilter] = useState<string>('all');
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<string>('');
  const [currentUtilityFilter, setCurrentUtilityFilter] = useState<string>('all');
  const [calculationType, setCalculationType] = useState<'consumption' | 'value'>('consumption');

  // History data loaded from DB
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<CurrentMonthRow | null>(null);
  const [editIndexNew, setEditIndexNew] = useState<string>('');

  // Close period confirmation dialog
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  // Generate available consumption periods (last 12 months + next 3 months from now)
  const availableConsumptionPeriods = useMemo(() => {
    const periods = new Set<string>();
    // Add current period
    if (currentPeriod) periods.add(currentPeriod);
    // Add all historical periods (already closed - will show as selectable but re-initializable)
    historicalPeriods.forEach(p => periods.add(p));
    // Generate from 12 months ago to 3 months ahead
    const now = new Date();
    for (let i = -12; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      periods.add(p);
    }
    return Array.from(periods).sort().reverse();
  }, [currentPeriod, historicalPeriods]);

  // Per-utility closing workflow - persisted in Dexie
  const [closedUtilities, setClosedUtilities] = useState<Set<string>>(new Set());
  const [utilityCloseDialogOpen, setUtilityCloseDialogOpen] = useState(false);
  const [closingUtilityType, setClosingUtilityType] = useState<string | null>(null);
  const [closingUtilityStats, setClosingUtilityStats] = useState<SummaryStatsData | null>(null);
  const confirmedLoadSeqRef = useRef(0);

  const loadConfirmedUtilities = useCallback(async (period: string) => {
    if (!period) {
      setClosedUtilities(new Set());
      return;
    }

    const seq = ++confirmedLoadSeqRef.current;
    const rows = await db.confirmedUtilities.where('period').equals(period).toArray();

    if (seq !== confirmedLoadSeqRef.current) return;
    setClosedUtilities(new Set(rows.map(r => r.utilityType)));
  }, []);

  useEffect(() => {
    void loadConfirmedUtilities(currentPeriod);
  }, [currentPeriod, loadConfirmedUtilities]);

  // Helper to compute summary stats from any row array
  const computeStats = (rows: { spaceId: string; clientId: string; consumption: number; unit: string; netValue: number; vatValue: number; totalValue: number }[]): SummaryStatsData => {
    const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });
    return {
      spacesCount: new Set(rows.map(r => r.spaceId)).size,
      clientsCount: new Set(rows.map(r => r.clientId)).size,
      totalConsumption: fmt(rows.reduce((s, r) => s + r.consumption, 0)),
      totalNetValue: fmt(rows.reduce((s, r) => s + r.netValue, 0)),
      totalVat: fmt(rows.reduce((s, r) => s + r.vatValue, 0)),
      totalValue: fmt(rows.reduce((s, r) => s + r.totalValue, 0)),
    };
  };

  const historyStats = useMemo(() => computeStats(historyData), [historyData]);
  // Set default history period once loaded
  useEffect(() => {
    if (historicalPeriods.length > 0 && !historyPeriodFilter) {
      setHistoryPeriodFilter(historicalPeriods[0]);
    }
  }, [historicalPeriods, historyPeriodFilter]);

  // Load history data when filters change
  useEffect(() => {
    if (ready && historyPeriodFilter) {
      getHistoryData(historyPeriodFilter, historyUtilityFilter).then(setHistoryData);
    }
  }, [ready, historyPeriodFilter, historyUtilityFilter, getHistoryData]);

  // Filtered current month with async value recalculation
  const [calculatedData, setCalculatedData] = useState<CurrentMonthRow[]>([]);
  
  useEffect(() => {
    let cancelled = false;
    const compute = async () => {
      let data = currentMonthData;
      if (calculationType === 'value') {
        data = await recalculateValues(data, currentPeriod);
      }
      if (currentUtilityFilter !== 'all') {
        data = data.filter(d => d.utilityType === currentUtilityFilter);
      }
      if (!cancelled) setCalculatedData(data);
    };
    compute();
    return () => { cancelled = true; };
  }, [currentMonthData, currentUtilityFilter, calculationType, currentPeriod, recalculateValues]);

  const filteredCurrentMonthData = calculatedData;

  const calculateConsumption = (utilityType: UtilityType, indexOld: number, indexNew: number, constant: number, isp?: number, csp?: number): number => {
    const utility = UTILITIES.find(u => u.id === utilityType);
    if (utility && !utility.hasMeter) {
      return (isp || 0) * (csp || 0);
    }
    const diff = Math.max(0, indexNew - indexOld);
    switch (utilityType) {
      case 'EE': return diff * constant;
      case 'GN': return diff * constant;
      case 'AC': return diff;
      default: return diff * constant;
    }
  };

  // Live preview: if editing a row, substitute its consumption with the preview value
  const liveCurrentMonthData = useMemo(() => {
    if (!editDialogOpen || !editingRow) return filteredCurrentMonthData;
    const previewIndexNew = parseFloat(editIndexNew) || 0;
    const previewIsp = editingRow.isp;
    const previewCsp = editingRow.csp;
    const previewConsumption = calculateConsumption(editingRow.utilityType, editingRow.indexOld, previewIndexNew, editingRow.constant, previewIsp, previewCsp);
    return filteredCurrentMonthData.map(item =>
      item.id === editingRow.id ? { ...item, consumption: previewConsumption, indexNew: previewIndexNew, isp: previewIsp, csp: previewCsp } : item
    );
  }, [filteredCurrentMonthData, editDialogOpen, editingRow, editIndexNew]);

  const currentStats = useMemo(() => {
    // For AC filter, use acValueData/acSpaceData instead of currentMonthData rows
    if (currentUtilityFilter === 'AC') {
      const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });
      const vData = acValueData;
      return {
        spacesCount: new Set(acSpaceData.map(r => r.spaceId)).size,
        clientsCount: new Set(acSpaceData.map(r => r.clientId)).size,
        totalConsumption: fmt(acSpaceData.reduce((s, r) => s + r.consumTotal, 0)),
        totalNetValue: fmt(vData.reduce((s, r) => s + r.valoareNeta, 0)),
        totalVat: fmt(vData.reduce((s, r) => s + r.valoareTva, 0)),
        totalValue: fmt(vData.reduce((s, r) => s + r.valoareTotala, 0)),
      } as SummaryStatsData;
    }
    if (currentUtilityFilter === 'AA') {
      const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });
      return {
        spacesCount: new Set(aaData.map(r => r.spaceId)).size,
        clientsCount: new Set(aaData.map(r => r.clientId)).size,
        totalConsumption: fmt(aaData.reduce((s, r) => s + r.cantitateAlocata, 0)),
        totalNetValue: fmt(aaData.reduce((s, r) => s + r.valoareNeta, 0)),
        totalVat: fmt(aaData.reduce((s, r) => s + r.valoareTva, 0)),
        totalValue: fmt(aaData.reduce((s, r) => s + r.total, 0)),
      } as SummaryStatsData;
    }
    if (currentUtilityFilter === 'AS') {
      const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });
      return {
        spacesCount: new Set(asData.map(r => r.spaceId)).size,
        clientsCount: new Set(asData.map(r => r.clientId)).size,
        totalConsumption: fmt(asData.reduce((s, r) => s + r.cantitateAlocata, 0)),
        totalNetValue: fmt(asData.reduce((s, r) => s + r.valoareNeta, 0)),
        totalVat: fmt(asData.reduce((s, r) => s + r.valoareTva, 0)),
        totalValue: fmt(asData.reduce((s, r) => s + r.total, 0)),
      } as SummaryStatsData;
    }
    if (currentUtilityFilter === 'SM') {
      const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });
      return {
        spacesCount: new Set(smData.map(r => r.spaceId)).size,
        clientsCount: new Set(smData.map(r => r.clientId)).size,
        totalConsumption: fmt(smData.reduce((s, r) => s + r.cantitateAlocata, 0)),
        totalNetValue: fmt(smData.reduce((s, r) => s + r.valoareNeta, 0)),
        totalVat: fmt(smData.reduce((s, r) => s + r.valoareTva, 0)),
        totalValue: fmt(smData.reduce((s, r) => s + r.total, 0)),
      } as SummaryStatsData;
    }
    if (currentUtilityFilter === 'SSV') {
      const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });
      return {
        spacesCount: new Set(ssvData.map(r => r.spaceId)).size,
        clientsCount: new Set(ssvData.map(r => r.clientId)).size,
        totalConsumption: fmt(ssvData.reduce((s, r) => s + r.cantitateAlocata, 0)),
        totalNetValue: fmt(ssvData.reduce((s, r) => s + r.valoareNeta, 0)),
        totalVat: fmt(ssvData.reduce((s, r) => s + r.valoareTva, 0)),
        totalValue: fmt(ssvData.reduce((s, r) => s + r.total, 0)),
      } as SummaryStatsData;
    }
    if (currentUtilityFilter === 'SC') {
      const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });
      return {
        spacesCount: new Set(scData.map(r => r.spaceId)).size,
        clientsCount: new Set(scData.map(r => r.clientId)).size,
        totalConsumption: fmt(scData.reduce((s, r) => s + r.cantitateAlocata, 0)),
        totalNetValue: fmt(scData.reduce((s, r) => s + r.valoareNeta, 0)),
        totalVat: fmt(scData.reduce((s, r) => s + r.valoareTva, 0)),
        totalValue: fmt(scData.reduce((s, r) => s + r.total, 0)),
      } as SummaryStatsData;
    }
    // Only count rows where data has been recorded
    const recordedRows = liveCurrentMonthData.filter(r => r.hasMeter ? r.indexNew > 0 : r.csp > 0);
    return computeStats(recordedRows);
  }, [liveCurrentMonthData, currentUtilityFilter, acSpaceData, acValueData, aaData, asData, smData, ssvData, scData]);

  // All distinct utility types present in current month data
  const activeUtilityTypes = useMemo(() => {
    return [...new Set(currentMonthData.map(r => r.utilityType))];
  }, [currentMonthData]);

  // Check if all active utilities have been confirmed closed
  const allUtilitiesClosed = useMemo(() => {
    return activeUtilityTypes.length > 0 && activeUtilityTypes.every(ut => closedUtilities.has(ut));
  }, [activeUtilityTypes, closedUtilities]);

  // Stats for a specific utility type (for per-utility close dialog)
  const getUtilityStats = useCallback(async (utilityType: string) => {
    if (utilityType === 'AC') {
      const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });
      return {
        spacesCount: new Set(acSpaceData.map(r => r.spaceId)).size,
        clientsCount: new Set(acSpaceData.map(r => r.clientId)).size,
        totalConsumption: fmt(acSpaceData.reduce((s, r) => s + r.consumTotal, 0)),
        totalNetValue: fmt(acValueData.reduce((s, r) => s + r.valoareNeta, 0)),
        totalVat: fmt(acValueData.reduce((s, r) => s + r.valoareTva, 0)),
        totalValue: fmt(acValueData.reduce((s, r) => s + r.valoareTotala, 0)),
      } as SummaryStatsData;
    }
    if (utilityType === 'AA') {
      const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });
      return {
        spacesCount: new Set(aaData.map(r => r.spaceId)).size,
        clientsCount: new Set(aaData.map(r => r.clientId)).size,
        totalConsumption: fmt(aaData.reduce((s, r) => s + r.cantitateAlocata, 0)),
        totalNetValue: fmt(aaData.reduce((s, r) => s + r.valoareNeta, 0)),
        totalVat: fmt(aaData.reduce((s, r) => s + r.valoareTva, 0)),
        totalValue: fmt(aaData.reduce((s, r) => s + r.total, 0)),
      } as SummaryStatsData;
    }
    if (utilityType === 'AS') {
      const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });
      return {
        spacesCount: new Set(asData.map(r => r.spaceId)).size,
        clientsCount: new Set(asData.map(r => r.clientId)).size,
        totalConsumption: fmt(asData.reduce((s, r) => s + r.cantitateAlocata, 0)),
        totalNetValue: fmt(asData.reduce((s, r) => s + r.valoareNeta, 0)),
        totalVat: fmt(asData.reduce((s, r) => s + r.valoareTva, 0)),
        totalValue: fmt(asData.reduce((s, r) => s + r.total, 0)),
      } as SummaryStatsData;
    }
    if (utilityType === 'SM') {
      const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });
      return {
        spacesCount: new Set(smData.map(r => r.spaceId)).size,
        clientsCount: new Set(smData.map(r => r.clientId)).size,
        totalConsumption: fmt(smData.reduce((s, r) => s + r.cantitateAlocata, 0)),
        totalNetValue: fmt(smData.reduce((s, r) => s + r.valoareNeta, 0)),
        totalVat: fmt(smData.reduce((s, r) => s + r.valoareTva, 0)),
        totalValue: fmt(smData.reduce((s, r) => s + r.total, 0)),
      } as SummaryStatsData;
    }
    if (utilityType === 'SSV') {
      const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });
      return {
        spacesCount: new Set(ssvData.map(r => r.spaceId)).size,
        clientsCount: new Set(ssvData.map(r => r.clientId)).size,
        totalConsumption: fmt(ssvData.reduce((s, r) => s + r.cantitateAlocata, 0)),
        totalNetValue: fmt(ssvData.reduce((s, r) => s + r.valoareNeta, 0)),
        totalVat: fmt(ssvData.reduce((s, r) => s + r.valoareTva, 0)),
        totalValue: fmt(ssvData.reduce((s, r) => s + r.total, 0)),
      } as SummaryStatsData;
    }
    if (utilityType === 'SC') {
      const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });
      return {
        spacesCount: new Set(scData.map(r => r.spaceId)).size,
        clientsCount: new Set(scData.map(r => r.clientId)).size,
        totalConsumption: fmt(scData.reduce((s, r) => s + r.cantitateAlocata, 0)),
        totalNetValue: fmt(scData.reduce((s, r) => s + r.valoareNeta, 0)),
        totalVat: fmt(scData.reduce((s, r) => s + r.valoareTva, 0)),
        totalValue: fmt(scData.reduce((s, r) => s + r.total, 0)),
      } as SummaryStatsData;
    }
    const rows = currentMonthData.filter(r => r.utilityType === utilityType);
    const withValues = await recalculateValues(rows, currentPeriod);
    return computeStats(withValues);
  }, [currentMonthData, recalculateValues, currentPeriod, acSpaceData, acValueData, aaData, asData, smData, ssvData, scData]);

  const handleConfirmUtility = async (utilityType: string) => {
    setClosingUtilityType(utilityType);
    const stats = await getUtilityStats(utilityType);
    setClosingUtilityStats(stats);
    setUtilityCloseDialogOpen(true);
  };

  const handleUtilityCloseConfirmed = async () => {
    if (closingUtilityType) {
      const existing = await db.confirmedUtilities
        .where('[period+utilityType]')
        .equals([currentPeriod, closingUtilityType as UtilityType])
        .first();

      if (!existing) {
        await db.confirmedUtilities.add({ period: currentPeriod, utilityType: closingUtilityType as UtilityType });
      }

      await loadConfirmedUtilities(currentPeriod);
      toast.success(`Utilitatea ${closingUtilityType} a fost confirmată pentru închidere.`);
    }
    setUtilityCloseDialogOpen(false);
    setClosingUtilityType(null);
  };

  const handleReopenUtility = async (utilityType: string) => {
    await db.confirmedUtilities.where('[period+utilityType]').equals([currentPeriod, utilityType]).delete();
    await loadConfirmedUtilities(currentPeriod);
    toast.info(`Utilitatea ${utilityType} a fost redeschisă.`);
  };

  const handleEditIndex = useCallback(async (row: CurrentMonthRow) => {
    let indexOld = row.indexOld;
    // If indexOld is 0, try to fetch from historical readings
    if (indexOld === 0) {
      const lastReadings = await db.meterReadings
        .where('[spaceId+utilityType+period]')
        .between([row.spaceId, row.utilityType, Dexie.minKey], [row.spaceId, row.utilityType, Dexie.maxKey])
        .toArray();
      const lastReading = lastReadings.sort((a, b) => b.period.localeCompare(a.period))[0];
      if (lastReading) {
        indexOld = lastReading.indexNew;
      }
    }
    setEditingRow({ ...row, indexOld });
    setEditIndexNew(String(row.indexNew || ''));
    setEditDialogOpen(true);
  }, []);

  const handleSaveIndex = async () => {
    if (!editingRow || !editingRow.dbId) return;
    const utility = UTILITIES.find(u => u.id === editingRow.utilityType);
    if (utility && !utility.hasMeter) {
      await updateReading(
        editingRow.id,
        editingRow.dbId,
        0, 0, 0,
        editingRow.utilityType,
        editingRow.isp,
        editingRow.csp
      );
    } else {
      const newIndexNew = parseFloat(editIndexNew) || 0;
      await updateReading(
        editingRow.id,
        editingRow.dbId,
        editingRow.indexOld,
        newIndexNew,
        editingRow.constant,
        editingRow.utilityType
      );
    }
    setEditDialogOpen(false);
    setEditingRow(null);
  };

  const handleClosePeriod = async () => {
    await db.confirmedUtilities.where('period').equals(currentPeriod).delete();
    await closePeriod(currentPeriod);
    setClosedUtilities(new Set());
    setCloseConfirmOpen(false);
  };

  const getUtilityDisplayName = (type: UtilityType): string => {
    if (type === 'AC') return 'A&C';
    return type;
  };

  const getUtilityColor = (type: UtilityType) => {
    const colors: Record<UtilityType, string> = {
      EE: 'bg-chart-ee/10 text-chart-ee border-chart-ee/30',
      GN: 'bg-chart-gn/10 text-chart-gn border-chart-gn/30',
      AC: 'bg-chart-ac/10 text-chart-ac border-chart-ac/30',
      AA: 'bg-chart-aa/10 text-chart-aa border-chart-aa/30',
      SM: 'bg-chart-sm/10 text-chart-sm border-chart-sm/30',
      AS: 'bg-chart-as/10 text-chart-as border-chart-as/30',
      SSV: 'bg-chart-sm/10 text-chart-sm border-chart-sm/30',
      SC: 'bg-chart-sc/10 text-chart-sc border-chart-sc/30',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const getUtilityIcon = (type: UtilityType) => {
    switch (type) {
      case 'EE': return <Zap className="w-4 h-4" />;
      case 'GN': return <Flame className="w-4 h-4" />;
      case 'AC': return <Droplets className="w-4 h-4" />;
      default: return <Calculator className="w-4 h-4" />;
    }
  };

  const getConstantLabel = (utilityType: UtilityType): string => {
    switch (utilityType) {
      case 'EE': return 'Const';
      case 'GN': return 'Pcs';
      case 'AC': return '-';
      case 'AA': case 'AS': return 'Csp';
      case 'SM': case 'SSV': case 'SC': return 'Csp';
      default: return 'Csp';
    }
  };

  const getIspLabel = (utilityType: UtilityType): string => {
    switch (utilityType) {
      case 'SM': case 'SSV': case 'SC': return 'mp';
      case 'AA': case 'AS': return 'pers';
      default: return 'Isp';
    }
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  if (!ready) {
    return (
      <MainLayout title="Utilități/Servicii" subtitle="Se încarcă...">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Se încarcă baza de date...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Utilități/Servicii" subtitle="Istoric consum și înregistrare luna curentă">
      <div className="space-y-6 animate-slide-up">
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Istoric
            </TabsTrigger>
            <TabsTrigger value="current" className="gap-2">
              <Calendar className="w-4 h-4" />
              Luna de Consum
            </TabsTrigger>
          </TabsList>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-3 flex-wrap">
                <Select value={historyUtilityFilter} onValueChange={setHistoryUtilityFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Utilitate/Serviciu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate Utilitățile</SelectItem>
                    {UTILITIES.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={historyPeriodFilter} onValueChange={setHistoryPeriodFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Perioadă" />
                  </SelectTrigger>
                  <SelectContent>
                    {historicalPeriods.map(period => (
                      <SelectItem key={period} value={period}>{formatPeriod(period)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {historyData.length > 0 && <SummaryStats data={historyStats} />}

            <div className="utility-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Spațiu</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Utilitate/Serviciu</TableHead>
                    <TableHead className="text-right">Consum</TableHead>
                    <TableHead className="text-right">Valoare Netă</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nu există date pentru această perioadă
                      </TableCell>
                    </TableRow>
                  ) : (
                    historyData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.spaceName}</TableCell>
                        <TableCell>{item.clientName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1.5 ${getUtilityColor(item.utilityType)}`}>
                            {getUtilityIcon(item.utilityType)}
                            {getUtilityDisplayName(item.utilityType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.consumption.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {item.utilityType === 'GN' ? 'kWh' : item.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.netValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.vatValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.totalValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* CURRENT MONTH TAB */}
          <TabsContent value="current" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-3 flex-wrap">
                <Select value={currentPeriod} onValueChange={(val) => {
                  setCurrentPeriod(val);
                  loadPeriodData(val);
                }}>
                  <SelectTrigger className="w-[150px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Perioadă" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableConsumptionPeriods.map(period => (
                      <SelectItem key={period} value={period}>{formatPeriod(period)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={currentUtilityFilter} onValueChange={setCurrentUtilityFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Utilitate/Serviciu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate Utilitățile</SelectItem>
                    {UTILITIES.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentUtilityFilter !== 'all' && currentUtilityFilter !== 'AA' && currentUtilityFilter !== 'AS' && currentUtilityFilter !== 'SM' && currentUtilityFilter !== 'SSV' && currentUtilityFilter !== 'SC' && (
                <Select value={calculationType} onValueChange={(v) => setCalculationType(v as 'consumption' | 'value')}>
                  <SelectTrigger className="w-[150px]">
                    <Calculator className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Calcul" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consumption">Consum</SelectItem>
                    <SelectItem value="value">Valoare</SelectItem>
                  </SelectContent>
                </Select>
                )}
              </div>
              <div className="flex gap-2">
                {!isInitialized && calculationType === 'consumption' && (
                  <Button className="gap-2" onClick={() => initializeConsumption(currentPeriod, currentUtilityFilter)}>
                    <Play className="w-4 h-4" />
                    Inițializare Consum
                  </Button>
                )}
                {isInitialized && currentUtilityFilter !== 'all' && !closedUtilities.has(currentUtilityFilter) && (
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => handleConfirmUtility(currentUtilityFilter)}
                  >
                    <Lock className="w-4 h-4" />
                    Confirmare {currentUtilityFilter}
                  </Button>
                )}
                {isInitialized && currentUtilityFilter !== 'all' && closedUtilities.has(currentUtilityFilter) && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleReopenUtility(currentUtilityFilter)}
                  >
                    Redeschide {currentUtilityFilter}
                  </Button>
                )}
                {isInitialized && (
                  <Button
                    variant="destructive"
                    className="gap-2"
                    disabled={!allUtilitiesClosed}
                    onClick={() => setCloseConfirmOpen(true)}
                    title={!allUtilitiesClosed ? `Confirmați mai întâi toate utilitățile: ${activeUtilityTypes.filter(ut => !closedUtilities.has(ut)).join(', ')}` : ''}
                  >
                    <Lock className="w-4 h-4" />
                    Închidere Lună Consum ({closedUtilities.size}/{activeUtilityTypes.length})
                  </Button>
                )}
              </div>
            </div>

            {/* Utility confirmation status badges */}
            {isInitialized && (
              <div className="flex flex-wrap gap-2">
                {UTILITIES.map(u => {
                  const isActive = activeUtilityTypes.includes(u.id);
                  const isClosed = closedUtilities.has(u.id);
                  return (
                    <Badge
                      key={u.id}
                      variant={isClosed ? 'default' : 'outline'}
                      className={`gap-1.5 cursor-pointer ${isClosed ? 'bg-green-600 hover:bg-green-700' : ''} ${!isActive ? 'opacity-40' : ''}`}
                      onClick={() => {
                        setCurrentUtilityFilter(u.id);
                        if (isActive && !isClosed) handleConfirmUtility(u.id);
                      }}
                    >
                      {isClosed ? '✓' : '○'} {getUtilityDisplayName(u.id)}
                    </Badge>
                  );
                })}
              </div>
            )}

            {isInitialized && (filteredCurrentMonthData.length > 0 || currentUtilityFilter === 'AC' && acSpaceData.length > 0 || currentUtilityFilter === 'AA' && aaData.length > 0 || currentUtilityFilter === 'AS' && asData.length > 0 || currentUtilityFilter === 'SM' && smData.length > 0 || currentUtilityFilter === 'SSV' && ssvData.length > 0 || currentUtilityFilter === 'SC' && scData.length > 0) && <SummaryStats data={currentStats} />}

            <div className="utility-card overflow-hidden">
              {currentUtilityFilter === 'SC' ? (
                <ScTable
                  scData={scData}
                  isInitialized={isInitialized}
                  isConfirmed={closedUtilities.has('SC')}
                  onDataChange={setScData}
                />
              ) : currentUtilityFilter === 'SSV' ? (
                <SsvTable
                  ssvData={ssvData}
                  isInitialized={isInitialized}
                  isConfirmed={closedUtilities.has('SSV')}
                  onDataChange={setSsvData}
                />
              ) : currentUtilityFilter === 'SM' ? (
                <SmTable
                  smData={smData}
                  isInitialized={isInitialized}
                  isConfirmed={closedUtilities.has('SM')}
                  onDataChange={setSmData}
                />
              ) : currentUtilityFilter === 'AS' ? (
                <AsTable
                  asData={asData}
                  isInitialized={isInitialized}
                  isConfirmed={closedUtilities.has('AS')}
                  onDataChange={setAsData}
                />
              ) : currentUtilityFilter === 'AA' ? (
                <AaTable
                  aaData={aaData}
                  isInitialized={isInitialized}
                  isConfirmed={closedUtilities.has('AA')}
                  onDataChange={setAaData}
                />
              ) : currentUtilityFilter === 'AC' ? (
                <AcTable
                  acSpaceData={acSpaceData}
                  acValueData={acValueData}
                  acSubLines={acSubLines}
                  calculationType={calculationType}
                  isInitialized={isInitialized}
                  onEditIndex={handleEditIndex}
                />
              ) : calculationType === 'consumption' ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Spațiu</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Utilitate/Serviciu</TableHead>
                      <TableHead className="text-right">Index Vechi</TableHead>
                      <TableHead className="text-right">Index Nou</TableHead>
                      <TableHead className="text-right">Const/Pcs/Cotă</TableHead>
                      <TableHead className="text-right">Consum</TableHead>
                      <TableHead className="w-[60px]">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isInitialized ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Apăsați "Inițializare Consum" pentru a începe înregistrarea
                        </TableCell>
                      </TableRow>
                    ) : filteredCurrentMonthData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Nu există date pentru filtrele selectate
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCurrentMonthData.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.spaceName}</TableCell>
                          <TableCell>{item.clientName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1.5 ${getUtilityColor(item.utilityType)}`}>
                              {getUtilityIcon(item.utilityType)}
                              {getUtilityDisplayName(item.utilityType)}
                            </Badge>
                          </TableCell>
                          {item.hasMeter ? (
                            <>
                              <TableCell className="text-right font-mono">
                                {item.indexOld > 0 ? item.indexOld.toLocaleString('ro-RO') : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                {item.indexNew > 0 ? item.indexNew.toLocaleString('ro-RO') : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-xs text-muted-foreground mr-1">{getConstantLabel(item.utilityType)}:</span>
                                {item.constant.toLocaleString('ro-RO', { minimumFractionDigits: 2 })}
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="text-right font-mono">
                                <span className="text-xs text-muted-foreground mr-1">{getIspLabel(item.utilityType)}:</span>
                                {item.isp > 0 ? item.isp.toLocaleString('ro-RO', { minimumFractionDigits: 2 }) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                <span className="text-xs text-muted-foreground mr-1">Csp:</span>
                                {item.csp > 0 ? item.csp.toLocaleString('ro-RO', { minimumFractionDigits: 2 }) : '-'}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">-</TableCell>
                            </>
                          )}
                          <TableCell className="text-right font-semibold">
                            {item.consumption.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {item.utilityType === 'GN' ? 'kWh' : item.unit}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditIndex(item)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Spațiu</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Utilitate/Serviciu</TableHead>
                      <TableHead className="text-right">Consum</TableHead>
                      <TableHead className="text-right">Valoare Netă</TableHead>
                      <TableHead className="text-right">TVA</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isInitialized ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Selectați mai întâi "Calcul Consum" și introduceți indexele
                        </TableCell>
                      </TableRow>
                    ) : filteredCurrentMonthData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nu există date pentru filtrele selectate
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCurrentMonthData.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.spaceName}</TableCell>
                          <TableCell>{item.clientName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1.5 ${getUtilityColor(item.utilityType)}`}>
                              {getUtilityIcon(item.utilityType)}
                              {getUtilityDisplayName(item.utilityType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.consumption.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {item.utilityType === 'GN' ? 'kWh' : item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.netValue > 0
                              ? `${item.netValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei`
                              : <span className="text-muted-foreground">0.00 lei</span>
                            }
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {item.vatValue > 0
                              ? `${item.vatValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei`
                              : '0.00 lei'
                            }
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.totalValue > 0
                              ? `${item.totalValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei`
                              : <span className="text-muted-foreground">0.00 lei</span>
                            }
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingRow?.hasMeter ? 'Introducere Index Nou' : 'Introducere Consum Serviciu'}
              </DialogTitle>
            </DialogHeader>
            {editingRow && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Spațiu</p>
                    <p className="font-medium">{editingRow.spaceName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Utilitate</p>
                    <Badge variant="outline" className={getUtilityColor(editingRow.utilityType)}>
                      {editingRow.utilityType}
                    </Badge>
                  </div>
                </div>

                {editingRow.hasMeter ? (
                  <>
                    <div className="space-y-2">
                      <Label>Index Vechi (din istoric)</Label>
                      <Input
                        type="number"
                        value={editingRow.indexOld}
                        onChange={(e) => setEditingRow({ ...editingRow, indexOld: parseFloat(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">Preluat automat din ultimul index înregistrat</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Index Nou *</Label>
                      <Input
                        type="number"
                        value={editIndexNew}
                        onChange={(e) => setEditIndexNew(e.target.value)}
                        placeholder="Introduceți indexul nou"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{getConstantLabel(editingRow.utilityType)}</Label>
                      <Input
                        type="number"
                        value={editingRow.constant}
                        onChange={(e) => setEditingRow({ ...editingRow, constant: parseFloat(e.target.value) || 1 })}
                        step="0.001"
                      />
                    </div>
                    <div className="p-3 bg-muted rounded-lg space-y-1">
                      <p className="text-sm text-muted-foreground">Consum calculat:</p>
                      {editingRow.utilityType === 'GN' ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Diferență indexe: <span className="font-semibold text-foreground">
                              {Math.max(0, (parseFloat(editIndexNew) || 0) - editingRow.indexOld).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} Nmc
                            </span>
                          </p>
                          <p className="text-xl font-bold">
                            {calculateConsumption(editingRow.utilityType, editingRow.indexOld, parseFloat(editIndexNew) || 0, editingRow.constant).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} kWh
                          </p>
                        </>
                      ) : (
                        <p className="text-xl font-bold">
                          {calculateConsumption(editingRow.utilityType, editingRow.indexOld, parseFloat(editIndexNew) || 0, editingRow.constant).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {editingRow.unit}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Identificator Specific (Isp) — {getIspLabel(editingRow.utilityType)}</Label>
                      <Input
                        type="number"
                        value={editingRow.isp}
                        onChange={(e) => setEditingRow({ ...editingRow, isp: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">
                        {editingRow.utilityType === 'SM' || editingRow.utilityType === 'SSV'
                          ? 'Suprafața spațiului (mp)'
                          : 'Numărul de persoane sau unități'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Consum Specific (Csp) — tarif/unitate</Label>
                      <Input
                        type="number"
                        value={editingRow.csp || ''}
                        onChange={(e) => setEditingRow({ ...editingRow, csp: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                        placeholder="Introduceți tariful per unitate"
                      />
                    </div>
                    <div className="p-3 bg-muted rounded-lg space-y-1">
                      <p className="text-sm text-muted-foreground">Consum calculat (Isp × Csp):</p>
                      <p className="text-xl font-bold">
                        {((editingRow.isp || 0) * (editingRow.csp || 0)).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {editingRow.unit}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Anulează</Button>
              <Button onClick={handleSaveIndex}>Salvează</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Per-Utility Close Confirmation Dialog */}
        <Dialog open={utilityCloseDialogOpen} onOpenChange={setUtilityCloseDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                Confirmare Închidere {closingUtilityType && UTILITIES.find(u => u.id === closingUtilityType)?.fullName}
              </DialogTitle>
              <DialogDescription>
                Confirmați că consumul și valorile repartizate pentru {closingUtilityType} în perioada {formatPeriod(currentPeriod)} sunt corecte?
              </DialogDescription>
            </DialogHeader>
            {closingUtilityStats && (
              <div className="py-4">
                <SummaryStats data={closingUtilityStats} compact />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setUtilityCloseDialogOpen(false)}>Anulează</Button>
              <Button onClick={handleUtilityCloseConfirmed}>
                <Lock className="w-4 h-4 mr-2" />
                Confirmă {closingUtilityType}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Close Period Confirmation Dialog */}
        <Dialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Confirmare Închidere Lună de Consum</DialogTitle>
              <DialogDescription>
                Sunteți sigur că doriți să închideți luna de consum {formatPeriod(currentPeriod)}? Datele vor fi transferate în istoric și nu vor mai putea fi modificate.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <SummaryStats data={currentStats} compact />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloseConfirmOpen(false)}>Anulează</Button>
              <Button variant="destructive" onClick={handleClosePeriod}>
                <Lock className="w-4 h-4 mr-2" />
                Închide Luna de Consum
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default UtilitiesServices;
