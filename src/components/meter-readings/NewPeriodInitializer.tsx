import { useState, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { spaces, clients } from '@/data/mockData';
import { UTILITIES, MeterReading, UtilityType } from '@/types/utility';
import { CalendarPlus, Zap, Flame, Droplets, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Helper to get previous period from YYYY-MM format
const getPreviousPeriod = (period: string): string => {
  const [year, month] = period.split('-').map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`;
};

// Generate available periods for initialization
const generatePeriods = () => {
  const periods: { value: string; label: string }[] = [];
  const now = new Date();
  const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 
                  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
  
  // Add next 2 months and current month
  for (let i = -2; i <= 0; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push({
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: `${months[date.getMonth()]} ${date.getFullYear()}`
    });
  }
  
  return periods;
};

const PERIODS = generatePeriods();

interface NewReadingEntry {
  spaceId: string;
  spaceName: string;
  clientName: string;
  utilityType: UtilityType;
  indexOld: number;
  indexNew: number | null;
  constant: number;
  pcs?: number;
}

interface NewPeriodInitializerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allReadings: MeterReading[];
  onSaveAll: (readings: Array<Omit<MeterReading, 'id'>>) => void;
}

const NewPeriodInitializer = ({ open, onOpenChange, allReadings, onSaveAll }: NewPeriodInitializerProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0]?.value || '');
  const [entries, setEntries] = useState<NewReadingEntry[]>([]);
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);

  // Get entries from previous period when period changes
  const previousPeriod = useMemo(() => getPreviousPeriod(selectedPeriod), [selectedPeriod]);
  
  const initializeFromPreviousPeriod = () => {
    const previousReadings = allReadings.filter(r => r.period === previousPeriod);
    
    if (previousReadings.length === 0) {
      toast.error(`Nu există citiri pentru perioada ${previousPeriod}`);
      return;
    }

    const newEntries: NewReadingEntry[] = previousReadings.map(reading => {
      const space = spaces.find(s => s.id === reading.spaceId);
      const client = space?.clientId ? clients.find(c => c.id === space.clientId) : null;
      
      return {
        spaceId: reading.spaceId,
        spaceName: space?.name || 'Necunoscut',
        clientName: client?.name || 'Liber',
        utilityType: reading.utilityType,
        indexOld: reading.indexNew, // IndexNou din luna trecută devine IndexVechi
        indexNew: null,
        constant: reading.constant,
        pcs: reading.pcs,
      };
    });

    setEntries(newEntries);
    toast.success(`Inițializate ${newEntries.length} citiri din ${previousPeriod}`);
  };

  const handleIndexNewChange = (index: number, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, indexNew: numValue } : entry
    ));
  };

  const getUtilityIcon = (type: UtilityType) => {
    switch (type) {
      case 'EE': return <Zap className="w-4 h-4 text-chart-ee" />;
      case 'GN': return <Flame className="w-4 h-4 text-chart-gn" />;
      case 'AC': return <Droplets className="w-4 h-4 text-chart-ac" />;
      default: return null;
    }
  };

  const calculateConsumption = (entry: NewReadingEntry): number => {
    if (entry.indexNew === null) return 0;
    const diff = entry.indexNew - entry.indexOld;
    if (entry.utilityType === 'GN' && entry.pcs) {
      return diff * entry.constant * entry.pcs;
    }
    return diff * entry.constant;
  };

  const getUtilityUnit = (type: UtilityType): string => {
    return UTILITIES.find(u => u.id === type)?.unit || '';
  };

  const filledEntries = entries.filter(e => e.indexNew !== null && e.indexNew >= e.indexOld);
  const invalidEntries = entries.filter(e => e.indexNew !== null && e.indexNew < e.indexOld);

  const handleSaveAll = () => {
    if (filledEntries.length === 0) {
      toast.error('Nu există citiri valide de salvat');
      return;
    }

    if (invalidEntries.length > 0) {
      toast.error(`${invalidEntries.length} citiri au indexul nou mai mic decât cel vechi`);
      return;
    }

    const readingsToSave = filledEntries.map(entry => ({
      spaceId: entry.spaceId,
      utilityType: entry.utilityType,
      period: selectedPeriod,
      indexOld: entry.indexOld,
      indexNew: entry.indexNew!,
      constant: entry.constant,
      pcs: entry.pcs,
      consumption: calculateConsumption(entry),
      readingDate: readingDate,
    }));

    onSaveAll(readingsToSave);
    onOpenChange(false);
    setEntries([]);
    toast.success(`${readingsToSave.length} citiri au fost salvate pentru ${selectedPeriod}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-primary" />
            Inițializare Perioadă Nouă
          </DialogTitle>
          <DialogDescription>
            Selectați noua perioadă și introduceți indexele citite la finalul lunii.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Period Selection */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Perioadă Nouă</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectați perioada" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Data Citirii</label>
              <Input 
                type="date" 
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
              />
            </div>
            <Button onClick={initializeFromPreviousPeriod} variant="secondary">
              <CalendarPlus className="w-4 h-4 mr-2" />
              Inițializează din {previousPeriod}
            </Button>
          </div>

          {/* Entries Table */}
          {entries.length > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {filledEntries.length} din {entries.length} citiri completate
                </span>
                {invalidEntries.length > 0 && (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {invalidEntries.length} citiri invalide
                  </span>
                )}
              </div>

              <ScrollArea className="h-[400px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="sticky top-0 bg-muted">Spațiu</TableHead>
                      <TableHead className="sticky top-0 bg-muted">Client</TableHead>
                      <TableHead className="sticky top-0 bg-muted">Utilitate</TableHead>
                      <TableHead className="sticky top-0 bg-muted text-right">Index Vechi</TableHead>
                      <TableHead className="sticky top-0 bg-muted text-right">K / PCS</TableHead>
                      <TableHead className="sticky top-0 bg-muted text-center w-[140px]">Index Nou</TableHead>
                      <TableHead className="sticky top-0 bg-muted text-right">Consum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, index) => {
                      const isInvalid = entry.indexNew !== null && entry.indexNew < entry.indexOld;
                      return (
                        <TableRow 
                          key={`${entry.spaceId}-${entry.utilityType}`}
                          className={isInvalid ? 'bg-destructive/10' : ''}
                        >
                          <TableCell className="font-medium">{entry.spaceName}</TableCell>
                          <TableCell className="text-muted-foreground">{entry.clientName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              {getUtilityIcon(entry.utilityType)}
                              {entry.utilityType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {entry.indexOld.toLocaleString('ro-RO')}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {entry.constant}
                            {entry.pcs && ` / ${entry.pcs}`}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="Index nou"
                              value={entry.indexNew ?? ''}
                              onChange={(e) => handleIndexNewChange(index, e.target.value)}
                              className={`text-right font-mono ${isInvalid ? 'border-destructive' : ''}`}
                            />
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {entry.indexNew !== null && (
                              <>
                                {calculateConsumption(entry).toLocaleString('ro-RO', { 
                                  minimumFractionDigits: 2, 
                                  maximumFractionDigits: 2 
                                })} {getUtilityUnit(entry.utilityType)}
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}

          {entries.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <CalendarPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Selectați perioada și apăsați "Inițializează" pentru a prelua datele din luna anterioară.</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Anulare
          </Button>
          <Button 
            onClick={handleSaveAll} 
            disabled={filledEntries.length === 0 || invalidEntries.length > 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvează {filledEntries.length} Citiri
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewPeriodInitializer;
