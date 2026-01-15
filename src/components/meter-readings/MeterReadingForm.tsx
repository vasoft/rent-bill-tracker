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
import { Gauge, Calculator } from 'lucide-react';

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
}

const MeterReadingForm = ({ open, onOpenChange, editingReading, onSave }: MeterReadingFormProps) => {
  const isEditing = !!editingReading;
  
  const form = useForm<MeterReadingFormData>({
    resolver: zodResolver(meterReadingSchema),
    defaultValues: {
      spaceId: '',
      utilityType: '',
      period: '2025-12',
      indexOld: 0,
      indexNew: 0,
      constant: 1,
      pcs: undefined,
      readingDate: new Date().toISOString().split('T')[0],
    },
  });

  const watchedUtility = form.watch('utilityType');
  const watchedIndexOld = form.watch('indexOld');
  const watchedIndexNew = form.watch('indexNew');
  const watchedConstant = form.watch('constant');
  const watchedPcs = form.watch('pcs');

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
    } else {
      form.reset({
        spaceId: '',
        utilityType: '',
        period: '2025-12',
        indexOld: 0,
        indexNew: 0,
        constant: 1,
        pcs: undefined,
        readingDate: new Date().toISOString().split('T')[0],
      });
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
                        <SelectItem value="2025-12">Decembrie 2025</SelectItem>
                        <SelectItem value="2025-11">Noiembrie 2025</SelectItem>
                        <SelectItem value="2025-10">Octombrie 2025</SelectItem>
                        <SelectItem value="2025-09">Septembrie 2025</SelectItem>
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

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="indexOld"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Index Vechi</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" {...field} />
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
                      <Input type="number" step="0.001" {...field} />
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
                      <Input type="number" step="0.001" {...field} />
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
