import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SupplierInvoice, Supplier, UTILITIES, UtilityType } from '@/types/utility';
import { Badge } from '@/components/ui/badge';

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Nr. factură este obligatoriu').max(50),
  supplierId: z.string().min(1, 'Furnizorul este obligatoriu'),
  utilityType: z.string().min(1, 'Utilitatea este obligatorie'),
  period: z.string().min(1, 'Perioada este obligatorie'),
  totalConsumption: z.coerce.number().min(0, 'Consumul trebuie să fie >= 0'),
  netValue: z.coerce.number().min(0, 'Valoarea netă trebuie să fie >= 0'),
  vatRate: z.coerce.number().min(0).max(100),
  vatValue: z.coerce.number().min(0, 'TVA trebuie să fie >= 0'),
});

type InvoiceValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'view';
  invoice?: SupplierInvoice | null;
  suppliers: Supplier[];
  existingPeriods: string[];
  onSubmit: (data: InvoiceValues) => void;
}

const InvoiceForm = ({
  open,
  onOpenChange,
  mode,
  invoice,
  suppliers,
  existingPeriods,
  onSubmit,
}: InvoiceFormProps) => {
  const form = useForm<InvoiceValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: '',
      supplierId: '',
      utilityType: '',
      period: '',
      totalConsumption: 0,
      netValue: 0,
      vatRate: 21,
      vatValue: 0,
    },
  });

  const netValue = form.watch('netValue');
  const vatValue = form.watch('vatValue');
  const totalValue = (Number(netValue) || 0) + (Number(vatValue) || 0);

  useEffect(() => {
    if (open) {
      if (mode === 'view' && invoice) {
        form.reset({
          invoiceNumber: invoice.invoiceNumber,
          supplierId: invoice.supplierId,
          utilityType: invoice.utilityType,
          period: invoice.period,
          totalConsumption: invoice.totalConsumption,
          netValue: invoice.netValue,
          vatRate: invoice.vatRate,
          vatValue: invoice.vatValue,
        });
      } else if (mode === 'add') {
        const currentDate = new Date();
        const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        form.reset({
          invoiceNumber: '',
          supplierId: '',
          utilityType: '',
          period: currentPeriod,
          totalConsumption: 0,
          netValue: 0,
          vatRate: 21,
          vatValue: 0,
        });
      }
    }
  }, [open, mode, invoice, form]);

  const handleSubmit = (data: InvoiceValues) => {
    onSubmit(data);
    onOpenChange(false);
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

  // Generate period options (current month + next 12 months)
  const generatePeriodOptions = () => {
    const periods: string[] = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 13; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      periods.push(period);
    }
    
    return periods;
  };

  const periodOptions = generatePeriodOptions();

  const formatPeriodDisplay = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  };

  const selectedSupplier = suppliers.find(s => s.id === form.watch('supplierId'));
  const selectedUtility = UTILITIES.find(u => u.id === form.watch('utilityType'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Adaugă Factură Furnizor' : 'Detalii Factură'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Completați datele facturii primite de la furnizor.'
              : 'Vizualizarea detaliilor facturii înregistrate.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Supplier Select */}
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Furnizor</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={mode === 'view'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează furnizor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Utility Select */}
            <FormField
              control={form.control}
              name="utilityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Utilitate</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={mode === 'view'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează utilitate" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UTILITIES.map((utility) => (
                        <SelectItem key={utility.id} value={utility.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getUtilityColor(utility.id)}>
                              {utility.name}
                            </Badge>
                            {utility.fullName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Period Select */}
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perioada</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={mode === 'view'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează perioada" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {periodOptions.map((period) => (
                        <SelectItem key={period} value={period}>
                          {formatPeriodDisplay(period)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Invoice Number */}
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nr. Factură</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ex: FE-2025-1234"
                      disabled={mode === 'view'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Consumption */}
            <FormField
              control={form.control}
              name="totalConsumption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Consum {selectedUtility ? `(${selectedUtility.unit})` : ''}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      step="0.01"
                      placeholder="0"
                      disabled={mode === 'view'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Net Value and VAT in a row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="netValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valoare Netă (lei)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.01"
                        placeholder="0"
                        disabled={mode === 'view'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vatValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TVA (lei)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.01"
                        placeholder="0"
                        disabled={mode === 'view'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* VAT Rate */}
            <FormField
              control={form.control}
              name="vatRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cotă TVA (%)</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(Number(val))} 
                    value={String(field.value)}
                    disabled={mode === 'view'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="21">21%</SelectItem>
                      <SelectItem value="11">11%</SelectItem>
                      <SelectItem value="9">9%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="0">0%</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Total - calculated */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="text-xl font-bold text-primary">
                  {totalValue.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                (Valoare Netă + TVA)
              </p>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                {mode === 'view' ? 'Închide' : 'Anulează'}
              </Button>
              {mode === 'add' && (
                <Button type="submit">
                  Salvează Factura
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceForm;
