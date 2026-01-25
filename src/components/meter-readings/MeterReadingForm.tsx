import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { spaces, clients } from '@/data/mockData';
import { UTILITIES, MeterReading, UtilityType } from '@/types/utility';
import { Gauge, Calculator, Info } from 'lucide-react';

// Helper to get previous period from YYYY-MM format
const getPreviousPeriod = (period: string): string => {
  const [year, month] = period.split('-').map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`;
};

// Generate available periods (last 12 months + next month) - memoized outside component
const PERIODS = (() => {
  const periods: { value: string; label: string }[] = [];
  const now = new Date();
  const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 
                  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
  
  // Add next month
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  periods.push({
    value: `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`,
    label: `${months[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`
  });
  
  // Add current and previous months
  for (let i = 0; i <= 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push({
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: `${months[date.getMonth()]} ${date.getFullYear()}`
    });
  }
  
  return periods;
})();

const meterReadingSchema = z.object({
  spaceId: z.string().min(1, 'Selectați spațiul'),
  utilityType: z.string().min(1, 'Selectați utilitatea'),
  period: z.string().min(1, 'Selectați perioada'),
  indexOld: z.coerce.number().min(0, 'Index vechi trebuie să fie pozitiv'),
  indexNew: z.coerce.number().min(0, 'Index nou trebuie să fie pozitiv'),
  constant: z.coerce.number().min(0.001, 'Constanta trebuie să fie mai mare ca 0'),
  pcs: z.coerce.number().optional(),
  readingDate: z.string().min(1, 'Selectați data citirii'),
}).refine((data) => data.indexNew >= data.indexOld, {
  message: "Indexul nou trebuie să fie mai mare sau egal cu cel vechi",
  path: ["indexNew"],
});

type MeterReadingFormData = z.infer<typeof meterReadingSchema>;

interface MeterReadingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingReading?: MeterReading | null;
  onSave: (reading: Omit<MeterReading, 'id'> & { id?: string }) => void;
  allReadings: MeterReading[]; // Pass all readings to find previous period data
}

const MeterReadingForm = ({ open, onOpenChange, editingReading, onSave, allReadings }: MeterReadingFormProps) => {
  const isEditing = !!editingReading;
  const [previousReadingInfo, setPreviousReadingInfo] = useState<string | null>(null);
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);
  
  const form = useForm<MeterReadingFormData>({
    resolver: zodResolver(meterReadingSchema),
    defaultValues: {
      spaceId: '',
      utilityType: '',
      period: PERIODS[0]?.value || '2026-01', // Default to next period
      indexOld: 0,
      indexNew: 0,
      constant: 1,
      pcs: undefined,
      readingDate: new Date().toISOString().split('T')[0],
    },
  });

  const watchedSpaceId = form.watch('spaceId');
  const watchedUtility = form.watch('utilityType');
  const watchedPeriod = form.watch('period');
  const watchedIndexOld = form.watch('indexOld');
  const watchedIndexNew = form.watch('indexNew');
  const watchedConstant = form.watch('constant');
  const watchedPcs = form.watch('pcs');

  // Auto-populate from previous period when space, utility, or period changes
  useEffect(() => {
    // Skip if editing or if required fields are not selected
    if (isEditing || !watchedSpaceId || !watchedUtility || !watchedPeriod) {
      setPreviousReadingInfo(null);
      return;
    }

    const previousPeriod = getPreviousPeriod(watchedPeriod);
    const previousReading = allReadings.find(
      r => r.spaceId === watchedSpaceId && 
           r.utilityType === watchedUtility && 
           r.period === previousPeriod
    );

    if (previousReading) {
      // Auto-populate indexOld with previous indexNew
      form.setValue('indexOld', previousReading.indexNew, { shouldValidate: true });
      // Auto-populate constant from previous reading
      form.setValue('constant', previousReading.constant, { shouldValidate: true });
      // Auto-populate PCS if it's natural gas
      if (previousReading.pcs !== undefined) {
        form.setValue('pcs', previousReading.pcs, { shouldValidate: true });
      }
      
      const months = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [year, month] = previousPeriod.split('-').map(Number);
      setPreviousReadingInfo(
        `Preluat din ${months[month - 1]} ${year}: Index=${previousReading.indexNew}, K=${previousReading.constant}${previousReading.pcs ? `, PCS=${previousReading.pcs}` : ''}`
      );
      setHasAutoPopulated(true);
    } else {
      setPreviousReadingInfo(null);
      setHasAutoPopulated(false);
    }
  }, [isEditing, watchedSpaceId, watchedUtility, watchedPeriod, allReadings, form]);

  const calculatedConsumption = (() => {
    const diff = (watchedIndexNew || 0) - (watchedIndexOld || 0);
    const constant = watchedConstant || 1;
    if (watchedUtility === 'GN' && watchedPcs) {
      return diff * constant * watchedPcs;
    }
    return diff * constant;
  })();

  const utilityInfo = UTILITIES.find(u => u.id === watchedUtility);
  const showPcs = watchedUtility === 'GN';

  // Reset form only when dialog opens/closes or when switching between edit/add mode
  useEffect(() => {
    if (!open) return; // Only run when dialog is open
    
    if (editingReading) {
      form.reset({
        spaceId: editingReading.spaceId,
        utilityType: editingReading.utilityType,
        period: editingReading.period,
        indexOld: editingReading.indexOld,
        indexNew: editingReading.indexNew,
        constant: editingReading.constant,
        pcs: editingReading.pcs,
        readingDate: editingReading.readingDate,
      });
      setPreviousReadingInfo(null);
      setHasAutoPopulated(false);
    } else {
      form.reset({
        spaceId: '',
        utilityType: '',
        period: PERIODS[0]?.value || '2026-01',
        indexOld: 0,
        indexNew: 0,
        constant: 1,
        pcs: undefined,
        readingDate: new Date().toISOString().split('T')[0],
      });
      setPreviousReadingInfo(null);
      setHasAutoPopulated(false);
    }
  }, [editingReading, form, open]);

  const onSubmit = (data: MeterReadingFormData) => {
    const consumption = (() => {
      const diff = data.indexNew - data.indexOld;
      if (data.utilityType === 'GN' && data.pcs) {
        return diff * data.constant * data.pcs;
      }
      return diff * data.constant;
    })();

    onSave({
      id: editingReading?.id,
      spaceId: data.spaceId,
      utilityType: data.utilityType as UtilityType,
      period: data.period,
      indexOld: data.indexOld,
      indexNew: data.indexNew,
      constant: data.constant,
      pcs: data.pcs,
      consumption,
      readingDate: data.readingDate,
    });

    onOpenChange(false);
    form.reset();
  };

  const getSpaceClient = (spaceId: string) => {
    const space = spaces.find(s => s.id === spaceId);
    if (!space?.clientId) return 'Liber';
    const client = clients.find(c => c.id === space.clientId);
    return client?.name || 'Necunoscut';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            {isEditing ? 'Editare Citire Contor' : 'Adăugare Citire Contor'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modificați datele citirii de contor.' : 'Completați formularul pentru a înregistra o nouă citire de contor.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="spaceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spațiu</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați spațiul" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {spaces.map((space) => (
                          <SelectItem key={space.id} value={space.id}>
                            {space.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="utilityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utilitate</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați utilitatea" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UTILITIES.filter(u => u.hasMeter).map((utility) => (
                          <SelectItem key={utility.id} value={utility.id}>
                            {utility.fullName} ({utility.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perioadă</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați perioada" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PERIODS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="readingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Citirii</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Previous reading info banner */}
            {previousReadingInfo && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span className="text-primary">{previousReadingInfo}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="indexOld"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Index Vechi</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001" 
                        {...field} 
                        className={previousReadingInfo ? "bg-muted" : ""}
                        readOnly={!!previousReadingInfo && !isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="indexNew"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Index Nou</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="constant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Constantă (K)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001" 
                        {...field}
                        className={previousReadingInfo ? "bg-muted" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showPcs && (
              <FormField
                control={form.control}
                name="pcs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PCS (Putere Calorifică Superioară)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001" 
                        placeholder="ex: 10.940"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Calculated Consumption Display */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Consum Calculat</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {calculatedConsumption.toLocaleString('ro-RO', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
                <span className="text-muted-foreground">
                  {utilityInfo?.unit || 'unități'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Formula: (Index Nou - Index Vechi) × Constantă{showPcs ? ' × PCS' : ''}
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Anulare
              </Button>
              <Button type="submit">
                {isEditing ? 'Salvează Modificările' : 'Adaugă Citirea'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MeterReadingForm;
