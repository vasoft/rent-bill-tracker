import { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  meterReadings as initialReadings, 
  consumptionDistributions as initialDistributions,
  supplierInvoices,
  spaces, 
  clients 
} from '@/data/mockData';
import { UTILITIES, UtilityType, MeterReading, ConsumptionDistribution } from '@/types/utility';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { History, Calendar, Zap, Flame, Droplets, Calculator, Play, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface CurrentMonthReading {
  id: string;
  spaceId: string;
  spaceName: string;
  clientId: string;
  clientName: string;
  utilityType: UtilityType;
  utilityName: string;
  unit: string;
  indexOld: number;
  indexNew: number;
  constant: number; // Const for EE, Pcs for GN, 1 for AC, Csp for services
  consumption: number;
  isInitialized: boolean;
}

interface CurrentMonthValue extends CurrentMonthReading {
  netValue: number;
  vatValue: number;
  totalValue: number;
}

const UtilitiesServices = () => {
  // State for readings
  const [readings, setReadings] = useState<MeterReading[]>(initialReadings);
  const [distributions] = useState<ConsumptionDistribution[]>(initialDistributions);
  
  // Filters
  const [historyUtilityFilter, setHistoryUtilityFilter] = useState<string>('all');
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<string>('2025-12');
  
  const [currentUtilityFilter, setCurrentUtilityFilter] = useState<string>('all');
  const [currentPeriodFilter, setCurrentPeriodFilter] = useState<string>('2026-01');
  const [calculationType, setCalculationType] = useState<'consumption' | 'value'>('consumption');
  
  // Current month data
  const [currentMonthData, setCurrentMonthData] = useState<CurrentMonthReading[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<CurrentMonthReading | null>(null);
  const [editIndexNew, setEditIndexNew] = useState<string>('');

  // Get available periods from historical data
  const availablePeriods = useMemo(() => {
    const periods = new Set<string>();
    readings.forEach(r => periods.add(r.period));
    distributions.forEach(d => periods.add(d.period));
    return Array.from(periods).sort().reverse();
  }, [readings, distributions]);

  // Get next period after last historical
  const getNextPeriod = (lastPeriod: string): string => {
    const [year, month] = lastPeriod.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
  };

  // History data - combine readings and distributions
  const historyData = useMemo(() => {
    const result: Array<{
      id: string;
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
    }> = [];

    // Get distributions for the selected period
    const periodDistributions = distributions.filter(d => d.period === historyPeriodFilter);
    
    periodDistributions.forEach(dist => {
      const space = spaces.find(s => s.id === dist.spaceId);
      const client = clients.find(c => c.id === dist.clientId);
      const utility = UTILITIES.find(u => u.id === dist.utilityType);
      
      result.push({
        id: dist.id,
        spaceId: dist.spaceId,
        spaceName: space?.name || 'Necunoscut',
        clientId: dist.clientId,
        clientName: client?.name || 'Necunoscut',
        utilityType: dist.utilityType,
        utilityName: utility?.fullName || dist.utilityType,
        consumption: dist.consumption,
        unit: utility?.unit || '',
        netValue: dist.netValue,
        vatValue: dist.vatValue,
        totalValue: dist.totalValue,
      });
    });

    return result;
  }, [distributions, historyPeriodFilter]);

  const filteredHistoryData = useMemo(() => {
    return historyData.filter(item => 
      historyUtilityFilter === 'all' || item.utilityType === historyUtilityFilter
    );
  }, [historyData, historyUtilityFilter]);

  // Initialize current month consumption
  const handleInitializeConsumption = () => {
    const newData: CurrentMonthReading[] = [];
    
    // Get spaces with clients
    const occupiedSpaces = spaces.filter(s => s.clientId !== null);
    
    // Filter utilities based on selection
    const utilitiesToProcess = currentUtilityFilter === 'all' 
      ? UTILITIES.filter(u => u.hasMeter) // Only metered utilities for consumption
      : UTILITIES.filter(u => u.id === currentUtilityFilter && u.hasMeter);
    
    occupiedSpaces.forEach(space => {
      const client = clients.find(c => c.id === space.clientId);
      
      utilitiesToProcess.forEach(utility => {
        // Get last reading from history for this space and utility
        const lastReading = readings
          .filter(r => r.spaceId === space.id && r.utilityType === utility.id)
          .sort((a, b) => b.period.localeCompare(a.period))[0];
        
        newData.push({
          id: `CM-${space.id}-${utility.id}`,
          spaceId: space.id,
          spaceName: space.name,
          clientId: space.clientId!,
          clientName: client?.name || 'Necunoscut',
          utilityType: utility.id,
          utilityName: utility.fullName,
          unit: utility.unit,
          indexOld: 0, // Will be populated when editing
          indexNew: 0,
          constant: lastReading?.constant || (utility.id === 'GN' ? lastReading?.pcs || 10.94 : 1),
          consumption: 0,
          isInitialized: true,
        });
      });
    });

    setCurrentMonthData(newData);
    setIsInitialized(true);
    toast.success('Consumul a fost inițializat pentru luna curentă!');
  };

  // Handle edit index
  const handleEditIndex = (row: CurrentMonthReading) => {
    // Get last IndexNew from history
    const lastReading = readings
      .filter(r => r.spaceId === row.spaceId && r.utilityType === row.utilityType)
      .sort((a, b) => b.period.localeCompare(a.period))[0];
    
    const updatedRow = {
      ...row,
      indexOld: lastReading?.indexNew || 0,
      constant: lastReading?.constant || (row.utilityType === 'GN' ? lastReading?.pcs || 10.94 : 1),
    };
    
    setEditingRow(updatedRow);
    setEditIndexNew(String(updatedRow.indexNew || ''));
    setEditDialogOpen(true);
  };

  // Calculate consumption based on utility type
  const calculateConsumption = (utilityType: UtilityType, indexOld: number, indexNew: number, constant: number): number => {
    const diff = Math.max(0, indexNew - indexOld);
    switch (utilityType) {
      case 'EE': // Energie Electrică: (IndexNou - IndexVechi) * Const
        return diff * constant;
      case 'GN': // Gaze Naturale: (IndexNou - IndexVechi) * Pcs
        return diff * constant;
      case 'AC': // Apă: (IndexNou - IndexVechi)
        return diff;
      default:
        return diff * constant;
    }
  };

  // Save edited index
  const handleSaveIndex = () => {
    if (!editingRow) return;
    
    const newIndexNew = parseFloat(editIndexNew) || 0;
    const consumption = calculateConsumption(
      editingRow.utilityType,
      editingRow.indexOld,
      newIndexNew,
      editingRow.constant
    );

    setCurrentMonthData(prev => prev.map(item => 
      item.id === editingRow.id 
        ? { ...item, indexOld: editingRow.indexOld, indexNew: newIndexNew, constant: editingRow.constant, consumption }
        : item
    ));

    setEditDialogOpen(false);
    setEditingRow(null);
    toast.success('Indexul a fost salvat!');
  };

  // Calculate value distribution
  const currentMonthWithValues = useMemo((): CurrentMonthValue[] => {
    if (calculationType !== 'value') return [];
    
    return currentMonthData.map(item => {
      // Find supplier invoice for this utility and period
      const invoice = supplierInvoices.find(
        inv => inv.utilityType === item.utilityType && inv.period === currentPeriodFilter
      );
      
      // Calculate total consumption for this utility in current month
      const totalConsumption = currentMonthData
        .filter(d => d.utilityType === item.utilityType)
        .reduce((sum, d) => sum + d.consumption, 0);
      
      // Calculate proportional value
      let netValue = 0;
      let vatValue = 0;
      let totalValue = 0;
      
      if (invoice && totalConsumption > 0) {
        const proportion = item.consumption / totalConsumption;
        netValue = invoice.netValue * proportion;
        vatValue = invoice.vatValue * proportion;
        totalValue = invoice.totalValue * proportion;
      }
      
      return {
        ...item,
        netValue,
        vatValue,
        totalValue,
      };
    });
  }, [currentMonthData, calculationType, currentPeriodFilter]);

  // Filter current month data
  const filteredCurrentMonthData = useMemo(() => {
    const data = calculationType === 'value' ? currentMonthWithValues : currentMonthData;
    return data.filter(item => 
      currentUtilityFilter === 'all' || item.utilityType === currentUtilityFilter
    );
  }, [currentMonthData, currentMonthWithValues, currentUtilityFilter, calculationType]);

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
                    {availablePeriods.map(period => {
                      const [year, month] = period.split('-');
                      const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return (
                        <SelectItem key={period} value={period}>
                          {monthNames[parseInt(month) - 1]} {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                  {filteredHistoryData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nu există date pentru această perioadă
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHistoryData.map((item) => (
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
                <Select value={currentPeriodFilter} onValueChange={setCurrentPeriodFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Perioadă" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Next periods after last historical */}
                    {availablePeriods.length > 0 && (
                      <>
                        <SelectItem value={getNextPeriod(availablePeriods[0])}>
                          {(() => {
                            const nextPeriod = getNextPeriod(availablePeriods[0]);
                            const [year, month] = nextPeriod.split('-');
                            const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            return `${monthNames[parseInt(month) - 1]} ${year}`;
                          })()}
                        </SelectItem>
                        <SelectItem value={getNextPeriod(getNextPeriod(availablePeriods[0]))}>
                          {(() => {
                            const nextPeriod = getNextPeriod(getNextPeriod(availablePeriods[0]));
                            const [year, month] = nextPeriod.split('-');
                            const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            return `${monthNames[parseInt(month) - 1]} ${year}`;
                          })()}
                        </SelectItem>
                      </>
                    )}
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
              {!isInitialized && calculationType === 'consumption' && (
                <Button className="gap-2" onClick={handleInitializeConsumption}>
                  <Play className="w-4 h-4" />
                  Inițializare Consum
                </Button>
              )}
            </div>

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
                      (filteredCurrentMonthData as CurrentMonthReading[]).map((item) => (
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
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleEditIndex(item)}
                            >
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
                    ) : (filteredCurrentMonthData as CurrentMonthValue[]).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nu există date pentru filtrele selectate
                        </TableCell>
                      </TableRow>
                    ) : (
                      (filteredCurrentMonthData as CurrentMonthValue[]).map((item) => (
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
                    onChange={(e) => setEditingRow({...editingRow, indexOld: parseFloat(e.target.value) || 0})}
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
                    onChange={(e) => setEditingRow({...editingRow, constant: parseFloat(e.target.value) || 1})}
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
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Anulează
              </Button>
              <Button onClick={handleSaveIndex}>
                Salvează
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default UtilitiesServices;
