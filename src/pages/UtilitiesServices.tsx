import { useState, useEffect, useMemo, useCallback } from 'react';
import Dexie from 'dexie';
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
    currentPeriod,
    setCurrentPeriod,
    getHistoryData,
    initializeConsumption,
    updateReading,
    recalculateValues,
    closePeriod,
  } = useUtilitiesDb();

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

  // Filtered current month
  const filteredCurrentMonthData = useMemo(() => {
    let data = currentMonthData;
    if (calculationType === 'value') {
      data = recalculateValues(data, currentPeriod);
    }
    if (currentUtilityFilter !== 'all') {
      data = data.filter(d => d.utilityType === currentUtilityFilter);
    }
    return data;
  }, [currentMonthData, currentUtilityFilter, calculationType, currentPeriod, recalculateValues]);

  const calculateConsumption = (utilityType: UtilityType, indexOld: number, indexNew: number, constant: number): number => {
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
    const previewConsumption = calculateConsumption(editingRow.utilityType, editingRow.indexOld, previewIndexNew, editingRow.constant);
    return filteredCurrentMonthData.map(item =>
      item.id === editingRow.id ? { ...item, consumption: previewConsumption, indexNew: previewIndexNew } : item
    );
  }, [filteredCurrentMonthData, editDialogOpen, editingRow, editIndexNew]);

  const currentStats = useMemo(() => {
    // Only count rows where indexNew has been recorded (> 0)
    const recordedRows = liveCurrentMonthData.filter(r => r.indexNew > 0);
    return computeStats(recordedRows);
  }, [liveCurrentMonthData]);

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
    const newIndexNew = parseFloat(editIndexNew) || 0;
    await updateReading(
      editingRow.id,
      editingRow.dbId,
      editingRow.indexOld,
      newIndexNew,
      editingRow.constant,
      editingRow.utilityType
    );
    setEditDialogOpen(false);
    setEditingRow(null);
  };

  const handleClosePeriod = async () => {
    await closePeriod(currentPeriod);
    setCloseConfirmOpen(false);
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
      default: return 'Csp';
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
              Luna Curentă
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
                            {item.utilityType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.consumption.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {item.unit}
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
                <Select value={currentPeriod} onValueChange={setCurrentPeriod}>
                  <SelectTrigger className="w-[150px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Perioadă" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={currentPeriod}>{formatPeriod(currentPeriod)}</SelectItem>
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
              </div>
              <div className="flex gap-2">
                {!isInitialized && calculationType === 'consumption' && (
                  <Button className="gap-2" onClick={() => initializeConsumption(currentPeriod, currentUtilityFilter)}>
                    <Play className="w-4 h-4" />
                    Inițializare Consum
                  </Button>
                )}
                {isInitialized && (
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => setCloseConfirmOpen(true)}
                  >
                    <Lock className="w-4 h-4" />
                    Închidere Perioadă
                  </Button>
                )}
              </div>
            </div>

            {isInitialized && filteredCurrentMonthData.length > 0 && <SummaryStats data={currentStats} />}

            <div className="utility-card overflow-hidden">
              {calculationType === 'consumption' ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Spațiu</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Utilitate/Serviciu</TableHead>
                      <TableHead className="text-right">Index Vechi</TableHead>
                      <TableHead className="text-right">Index Nou</TableHead>
                      <TableHead className="text-right">Const/Pcs/Csp</TableHead>
                      <TableHead className="text-right">Consum</TableHead>
                      <TableHead className="w-[60px]">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isInitialized ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Apăsați "Inițializare Consum" pentru a începe înregistrarea indexelor
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
                              {item.utilityType}
                            </Badge>
                          </TableCell>
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
                          <TableCell className="text-right font-semibold">
                            {item.consumption.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {item.unit}
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
                              {item.utilityType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.consumption.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {item.unit}
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

        {/* Edit Index Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Introducere Index Nou</DialogTitle>
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
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Consum calculat:</p>
                  <p className="text-xl font-bold">
                    {calculateConsumption(
                      editingRow.utilityType,
                      editingRow.indexOld,
                      parseFloat(editIndexNew) || 0,
                      editingRow.constant
                    ).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {editingRow.unit}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Anulează</Button>
              <Button onClick={handleSaveIndex}>Salvează</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Close Period Confirmation Dialog */}
        <Dialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Confirmare Închidere Perioadă</DialogTitle>
              <DialogDescription>
                Sunteți sigur că doriți să închideți perioada {formatPeriod(currentPeriod)}? Datele vor fi transferate în istoric și nu vor mai putea fi modificate.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <SummaryStats data={currentStats} compact />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloseConfirmOpen(false)}>Anulează</Button>
              <Button variant="destructive" onClick={handleClosePeriod}>
                <Lock className="w-4 h-4 mr-2" />
                Închide Perioada
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default UtilitiesServices;
