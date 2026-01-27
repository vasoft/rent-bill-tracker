import { useState, useEffect, useMemo } from 'react';
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

const MONTHS = [
  { value: '01', label: 'Ianuarie' },
  { value: '02', label: 'Februarie' },
  { value: '03', label: 'Martie' },
  { value: '04', label: 'Aprilie' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Iunie' },
  { value: '07', label: 'Iulie' },
  { value: '08', label: 'August' },
  { value: '09', label: 'Septembrie' },
  { value: '10', label: 'Octombrie' },
  { value: '11', label: 'Noiembrie' },
  { value: '12', label: 'Decembrie' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
const FUTURE_YEARS = Array.from({ length: 3 }, (_, i) => currentYear + i); // Current year + 2 future years

const meterReadingSchema = z.object({
  spaceId: z.string().min(1, 'Selectați spațiul'),
  utilityType: z.string().min(1, 'Selectați utilitatea'),
  periodMonth: z.string().min(1, 'Selectați luna'),
  periodYear: z.string().min(1, 'Selectați anul'),
  indexOld: z.coerce.number().min(0, 'Index vechi trebuie să fie pozitiv'),
  indexNew: z.coerce.number().min(0, 'Index nou trebuie să fie pozitiv'),
  constant: z.coerce.number().min(0.001, 'Constanta trebuie să fie mai mare ca 0'),
  pcs: z.coerce.number().optional(),
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
  allReadings: MeterReading[];
}

const MeterReadingForm = ({ open, onOpenChange, editingReading, onSave, allReadings }: MeterReadingFormProps) => {
  const isEditing = !!editingReading;
  
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(currentYear);
  
  const form = useForm<MeterReadingFormData>({
    resolver: zodResolver(meterReadingSchema),
    defaultValues: {
      spaceId: '',
      utilityType: '',
      periodMonth: currentMonth,
      periodYear: currentYearStr,
      indexOld: 0,
      indexNew: 0,
      constant: 1,
      pcs: undefined,
    },
  });

  const watchedSpaceId = form.watch('spaceId');
  const watchedUtility = form.watch('utilityType');
  const watchedMonth = form.watch('periodMonth');
  const watchedYear = form.watch('periodYear');
  const watchedIndexOld = form.watch('indexOld');
  const watchedIndexNew = form.watch('indexNew');
  const watchedConstant = form.watch('constant');
  const watchedPcs = form.watch('pcs');

  // Get available periods from history for editing mode
  const availableHistoryPeriods = useMemo(() => {
    if (!isEditing) return { months: MONTHS, years: YEARS };
    
    // Get all unique periods from readings
    const periods = [...new Set(allReadings.map(r => r.period))];
    const uniqueYears = [...new Set(periods.map(p => p.split('-')[0]))].sort();
    const uniqueMonths = [...new Set(periods.map(p => p.split('-')[1]))].sort();
    
    return {
      years: uniqueYears.map(y => parseInt(y)),
      months: MONTHS.filter(m => uniqueMonths.includes(m.value)),
    };
  }, [isEditing, allReadings]);

  // Get available months for add mode (current and future only)
  const availableAddPeriods = useMemo(() => {
    const currentMonthNum = new Date().getMonth() + 1;
    const selectedYear = parseInt(watchedYear) || currentYear;
    
    if (selectedYear > currentYear) {
      // Future year - all months available
      return { months: MONTHS, years: FUTURE_YEARS };
    } else if (selectedYear === currentYear) {
      // Current year - only current month and future months
      return {
        months: MONTHS.filter(m => parseInt(m.value) >= currentMonthNum),
        years: FUTURE_YEARS,
      };
    } else {
      // Past year - no months available (shouldn't happen with year filter)
      return { months: [], years: FUTURE_YEARS };
    }
  }, [watchedYear]);

  // Find the previous reading for auto-population
  const previousReading = useMemo(() => {
    if (!watchedSpaceId || !watchedUtility || !watchedMonth || !watchedYear) return null;
    
    const currentPeriod = `${watchedYear}-${watchedMonth}`;
    
    // Find all readings for this space and utility
    const spaceUtilityReadings = allReadings.filter(
      r => r.spaceId === watchedSpaceId && r.utilityType === watchedUtility && r.period < currentPeriod
    );
    
    if (spaceUtilityReadings.length === 0) return null;
    
    // Sort by period descending and get the most recent one
    spaceUtilityReadings.sort((a, b) => b.period.localeCompare(a.period));
    return spaceUtilityReadings[0];
  }, [watchedSpaceId, watchedUtility, watchedMonth, watchedYear, allReadings]);

  // Find the reading for the selected period in view mode
  const viewedReading = useMemo(() => {
    if (!isEditing || !watchedSpaceId || !watchedUtility || !watchedMonth || !watchedYear) return null;
    
    const period = `${watchedYear}-${watchedMonth}`;
    return allReadings.find(
      r => r.spaceId === watchedSpaceId && r.utilityType === watchedUtility && r.period === period
    ) || null;
  }, [isEditing, watchedSpaceId, watchedUtility, watchedMonth, watchedYear, allReadings]);

  // Auto-populate indexOld, constant, and pcs when space/utility/period changes
  useEffect(() => {
    if (isEditing) return; // Don't auto-populate when editing
    
    if (previousReading) {
      form.setValue('indexOld', previousReading.indexNew);
      form.setValue('constant', previousReading.constant);
      if (previousReading.pcs) {
        form.setValue('pcs', previousReading.pcs);
      }
    } else {
      form.setValue('indexOld', 0);
    }
  }, [previousReading, isEditing, form]);

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

  useEffect(() => {
    if (editingReading) {
      const [year, month] = editingReading.period.split('-');
      form.reset({
        spaceId: editingReading.spaceId,
        utilityType: editingReading.utilityType,
        periodMonth: month,
        periodYear: year,
        indexOld: editingReading.indexOld,
        indexNew: editingReading.indexNew,
        constant: editingReading.constant,
        pcs: editingReading.pcs,
      });
    } else {
      form.reset({
        spaceId: '',
        utilityType: '',
        periodMonth: currentMonth,
        periodYear: currentYearStr,
        indexOld: 0,
        indexNew: 0,
        constant: 1,
        pcs: undefined,
      });
    }
  }, [editingReading, form, open, currentMonth, currentYearStr]);

  const onSubmit = (data: MeterReadingFormData) => {
    const period = `${data.periodYear}-${data.periodMonth}`;
    
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
      period,
      indexOld: data.indexOld,
      indexNew: data.indexNew,
      constant: data.constant,
      pcs: data.pcs,
      consumption,
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
            {isEditing ? 'Vizualizare Istoric Consum' : 'Adăugare Citire Contor'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Vizualizați istoricul de consum selectând spațiul, utilitatea și perioada dorită.' : 'Completați formularul pentru a înregistra o nouă citire de contor.'}
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

            {/* Period Selection - Month and Year */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="periodMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Luna</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați luna" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(isEditing ? availableHistoryPeriods.months : availableAddPeriods.months).map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
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
                name="periodYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anul</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectați anul" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(isEditing ? availableHistoryPeriods.years : availableAddPeriods.years).map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Previous reading info */}
            {previousReading && !isEditing && (
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Index vechi preluat din perioada </span>
                  <span className="font-medium">{MONTHS.find(m => m.value === previousReading.period.split('-')[1])?.label} {previousReading.period.split('-')[0]}</span>
                  <span className="text-muted-foreground">: </span>
                  <span className="font-semibold text-primary">{previousReading.indexNew.toLocaleString('ro-RO')}</span>
                </div>
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
                        value={isEditing && viewedReading ? viewedReading.indexOld : field.value}
                        disabled={isEditing}
                        className={isEditing ? 'bg-muted' : ''}
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
                      <Input 
                        type="number" 
                        step="0.001" 
                        {...field}
                        value={isEditing && viewedReading ? viewedReading.indexNew : field.value}
                        disabled={isEditing}
                        className={isEditing ? 'bg-muted' : ''}
                      />
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
                    <FormLabel>Constantă</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001" 
                        {...field}
                        value={isEditing && viewedReading ? viewedReading.constant : field.value}
                        disabled={isEditing}
                        className={isEditing ? 'bg-muted' : ''}
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
                        value={isEditing && viewedReading ? (viewedReading.pcs || '') : (field.value || '')}
                        disabled={isEditing}
                        className={isEditing ? 'bg-muted' : ''}
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
                <span className="text-sm font-medium">{isEditing ? 'Consum Înregistrat' : 'Consum Calculat'}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {isEditing && viewedReading 
                    ? Math.max(0, viewedReading.consumption).toLocaleString('ro-RO', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })
                    : Math.max(0, calculatedConsumption).toLocaleString('ro-RO', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })
                  }
                </span>
                <span className="text-muted-foreground">
                  {utilityInfo?.unit || 'unități'}
                </span>
              </div>
              {!isEditing && (
                <p className="text-xs text-muted-foreground mt-1">
                  Formula: (Index Nou - Index Vechi) × Constantă{showPcs ? ' × PCS' : ''}
                </p>
              )}
              {isEditing && !viewedReading && (
                <p className="text-xs text-muted-foreground mt-1">
                  Nu există înregistrare pentru selecția curentă.
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {isEditing ? 'Închide' : 'Anulare'}
              </Button>
              {!isEditing && (
                <Button type="submit">
                  Adaugă Citirea
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MeterReadingForm;
