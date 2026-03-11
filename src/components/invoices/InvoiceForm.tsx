import { useEffect, useState, useCallback } from 'react';
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
import { SupplierInvoice, Supplier, UtilityType, UtilityInfo, AcSubLine, AC_SUB_SERVICES, InvoiceType } from '@/types/utility';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db } from '@/lib/db';

const parsePeriodInput = (input: string): string | null => {
  const match = input.match(/^(\d{1,2})[.\-/](\d{2,4})$/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, '0')}`;
};

const formatPeriodToInput = (period: string): string => {
  if (!period) return '';
  const [year, month] = period.split('-');
  if (!year || !month) return period;
  return `${month}.${year.slice(-2)}`;
};

const invoiceSchema = z.object({
  invoiceType: z.enum(['FF', 'FE', 'FR']).default('FF'),
  invoiceNumber: z.string().min(1, 'Nr. factură este obligatoriu').max(50),
  supplierId: z.string().min(1, 'Furnizorul este obligatoriu'),
  utilityType: z.string().min(1, 'Utilitatea este obligatorie'),
  period: z.string().min(1, 'Perioada este obligatorie'),
  totalConsumption: z.coerce.number(),
  netValueTaxable: z.coerce.number(),
  netValueExempt: z.coerce.number().min(0, 'Valoarea netă scutită trebuie să fie >= 0'),
  vatRate: z.coerce.number().min(0).max(100),
  vatValue: z.coerce.number(),
});

type InvoiceValues = z.infer<typeof invoiceSchema>;

export interface InvoiceFormSubmitData extends InvoiceValues {
  acSubLines?: AcSubLine[];
  invoiceType: InvoiceType;
}

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'view';
  invoice?: SupplierInvoice | null;
  suppliers: Supplier[];
  utilities: UtilityInfo[];
  existingPeriods: string[];
  onSubmit: (data: InvoiceFormSubmitData) => void;
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => Supplier;
  onAddUtility: (utility: Omit<UtilityInfo, 'id'>) => UtilityInfo;
}

const createDefaultAcSubLines = (): AcSubLine[] =>
  AC_SUB_SERVICES.map(s => ({
    code: s.code,
    name: s.name,
    consumption: 0,
    unit: s.unit,
    hasMeter: s.hasMeter,
    netValue: 0,
    vatRate: s.defaultVatRate,
    vatValue: 0,
    totalValue: 0,
  }));

const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  FF: 'Factură Furnizor',
  FE: 'Factură Estimată',
  FR: 'Factură Regularizare',
};

const InvoiceForm = ({
  open,
  onOpenChange,
  mode,
  invoice,
  suppliers,
  utilities,
  existingPeriods,
  onSubmit,
  onAddSupplier,
  onAddUtility,
}: InvoiceFormProps) => {
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddUtility, setShowAddUtility] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContract, setNewSupplierContract] = useState('');
  const [newUtilityCode, setNewUtilityCode] = useState('');
  const [newUtilityName, setNewUtilityName] = useState('');
  const [newUtilityUnit, setNewUtilityUnit] = useState('');
  const [newUtilityHasMeter, setNewUtilityHasMeter] = useState(false);
  const [acSubLines, setAcSubLines] = useState<AcSubLine[]>(createDefaultAcSubLines());
  const [frError, setFrError] = useState<string | null>(null);
  const [frCalculating, setFrCalculating] = useState(false);

  const form = useForm<InvoiceValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceType: 'FF',
      invoiceNumber: '',
      supplierId: '',
      utilityType: '',
      period: '',
      totalConsumption: 0,
      netValueTaxable: 0,
      netValueExempt: 0,
      vatRate: 9,
      vatValue: 0,
    },
  });

  const watchedInvoiceType = form.watch('invoiceType') as InvoiceType;
  const watchedUtilityType = form.watch('utilityType');
  const watchedPeriod = form.watch('period');
  const isAC = watchedUtilityType === 'AC';
  const isFR = watchedInvoiceType === 'FR';

  const netValueTaxable = form.watch('netValueTaxable');
  const netValueExempt = form.watch('netValueExempt');
  const vatRate = form.watch('vatRate');
  const vatValue = form.watch('vatValue');
  const netValue = (Number(netValueTaxable) || 0) + (Number(netValueExempt) || 0);
  const totalValue = netValue + (Number(vatValue) || 0);

  // FR auto-calculation: when invoiceType=FR + utility + period are set, calculate difference
  const calculateFR = useCallback(async (utilityType: string, period: string) => {
    if (!utilityType || !period) return;
    
    setFrCalculating(true);
    setFrError(null);
    
    try {
      // Find FF and FE for same utility+period
      const allInvoices = await db.supplierInvoices
        .where('[utilityType+period]')
        .equals([utilityType, period])
        .toArray();
      
      const ffInvoice = allInvoices.find(inv => inv.invoiceType === 'FF');
      const feInvoice = allInvoices.find(inv => inv.invoiceType === 'FE');
      
      if (!ffInvoice) {
        setFrError(`Nu există Factură Furnizor (FF) pentru ${utilityType} în perioada selectată.`);
        setFrCalculating(false);
        return;
      }
      if (!feInvoice) {
        setFrError(`Nu există Factură Estimată (FE) pentru ${utilityType} în perioada selectată.`);
        setFrCalculating(false);
        return;
      }
      
      // Calculate difference: FF - FE (can be negative)
      const consumptionDiff = ffInvoice.totalConsumption - feInvoice.totalConsumption;
      const netTaxableDiff = ffInvoice.netValueTaxable - feInvoice.netValueTaxable;
      const netExemptDiff = ffInvoice.netValueExempt - feInvoice.netValueExempt;
      const vatValueDiff = ffInvoice.vatValue - feInvoice.vatValue;
      
      // Inherit supplier and vatRate from FF
      form.setValue('supplierId', ffInvoice.supplierId);
      form.setValue('totalConsumption', consumptionDiff);
      form.setValue('netValueTaxable', netTaxableDiff);
      form.setValue('netValueExempt', netExemptDiff);
      form.setValue('vatRate', ffInvoice.vatRate);
      form.setValue('vatValue', vatValueDiff);
      form.setValue('invoiceNumber', `FR-${ffInvoice.invoiceNumber}`);
      
    } catch (err) {
      setFrError('Eroare la calculul regularizării.');
    }
    
    setFrCalculating(false);
  }, [form]);

  // Trigger FR calculation when relevant fields change
  useEffect(() => {
    if (mode === 'add' && watchedInvoiceType === 'FR' && watchedUtilityType && watchedPeriod) {
      calculateFR(watchedUtilityType, watchedPeriod);
    }
  }, [watchedInvoiceType, watchedUtilityType, watchedPeriod, mode, calculateFR]);

  // For AC: sync totals from sub-lines
  const updateAcTotals = (lines: AcSubLine[]) => {
    const totalCons = lines.reduce((s, l) => s + l.consumption, 0);
    const totalNet = lines.reduce((s, l) => s + l.netValue, 0);
    const totalVat = lines.reduce((s, l) => s + l.vatValue, 0);
    const netTaxable = lines.filter(l => l.vatRate > 0).reduce((s, l) => s + l.netValue, 0);
    const netExempt = lines.filter(l => l.vatRate === 0).reduce((s, l) => s + l.netValue, 0);

    form.setValue('totalConsumption', totalCons);
    form.setValue('netValueTaxable', netTaxable);
    form.setValue('netValueExempt', netExempt);
    form.setValue('vatValue', totalVat);
    const firstTaxable = lines.find(l => l.vatRate > 0);
    if (firstTaxable) form.setValue('vatRate', firstTaxable.vatRate);
  };

  const handleAcSubLineChange = (index: number, field: keyof AcSubLine, value: number) => {
    setAcSubLines(prev => {
      const updated = [...prev];
      const line = { ...updated[index] };
      (line as any)[field] = value;
      line.totalValue = line.netValue + line.vatValue;
      updated[index] = line;
      updateAcTotals(updated);
      return updated;
    });
  };

  useEffect(() => {
    if (open) {
      setShowAddSupplier(false);
      setShowAddUtility(false);
      setNewSupplierName('');
      setNewSupplierContract('');
      setNewUtilityCode('');
      setNewUtilityName('');
      setNewUtilityUnit('');
      setNewUtilityHasMeter(false);
      setFrError(null);

      if (mode === 'view' && invoice) {
        form.reset({
          invoiceType: invoice.invoiceType || 'FF',
          invoiceNumber: invoice.invoiceNumber,
          supplierId: invoice.supplierId,
          utilityType: invoice.utilityType,
          period: invoice.period,
          totalConsumption: invoice.totalConsumption,
          netValueTaxable: invoice.netValueTaxable,
          netValueExempt: invoice.netValueExempt,
          vatRate: invoice.vatRate,
          vatValue: invoice.vatValue,
        });
        setAcSubLines(invoice.acSubLines || createDefaultAcSubLines());
      } else if (mode === 'add') {
        const currentDate = new Date();
        const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        form.reset({
          invoiceType: 'FF',
          invoiceNumber: '',
          supplierId: '',
          utilityType: '',
          period: currentPeriod,
          totalConsumption: 0,
          netValueTaxable: 0,
          netValueExempt: 0,
          vatRate: 9,
          vatValue: 0,
        });
        setAcSubLines(createDefaultAcSubLines());
      }
    }
  }, [open, mode, invoice, form]);

  const handleAddNewSupplier = () => {
    if (newSupplierName.trim()) {
      const selectedUtility = form.watch('utilityType') as UtilityType || 'EE';
      const newSupplier = onAddSupplier({
        name: newSupplierName.trim(),
        utilityType: selectedUtility,
        contractNumber: newSupplierContract.trim() || undefined,
      });
      form.setValue('supplierId', newSupplier.id);
      setShowAddSupplier(false);
      setNewSupplierName('');
      setNewSupplierContract('');
    }
  };

  const handleAddNewUtility = () => {
    if (newUtilityCode.trim() && newUtilityName.trim()) {
      const newUtility = onAddUtility({
        name: newUtilityCode.trim().toUpperCase(),
        fullName: newUtilityName.trim(),
        unit: newUtilityUnit.trim() || 'unitate',
        color: 'chart-sm',
        hasMeter: newUtilityHasMeter,
      });
      form.setValue('utilityType', newUtility.id);
      setShowAddUtility(false);
      setNewUtilityCode('');
      setNewUtilityName('');
      setNewUtilityUnit('');
      setNewUtilityHasMeter(false);
    }
  };

  const handleSubmit = (data: InvoiceValues) => {
    // Block FR submission if there's an error
    if (data.invoiceType === 'FR' && frError) return;
    
    onSubmit({
      ...data,
      invoiceType: data.invoiceType as InvoiceType,
      acSubLines: isAC ? acSubLines : undefined,
    });
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
      SC: 'bg-chart-sc/10 text-chart-sc border-chart-sc/30',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const formatPeriodDisplay = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  };

  const selectedUtility = utilities.find(u => u.id === watchedUtilityType);

  // AC sub-lines totals for summary
  const acTotalNet = acSubLines.reduce((s, l) => s + l.netValue, 0);
  const acTotalVat = acSubLines.reduce((s, l) => s + l.vatValue, 0);
  const acTotalValue = acSubLines.reduce((s, l) => s + l.totalValue, 0);

  // Format value that can be negative (for FR)
  const formatValue = (val: number) => {
    const formatted = Math.abs(val).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return val < 0 ? `-${formatted}` : formatted;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Adaugă Factură' : `Detalii Factură ${invoice?.invoiceType || 'FF'}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Selectați tipul facturii și completați datele.'
              : 'Vizualizarea detaliilor facturii înregistrate.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Invoice Type Selector */}
            <FormField
              control={form.control}
              name="invoiceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tip Factură</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={(val) => {
                        if (val) field.onChange(val);
                      }}
                      disabled={mode === 'view'}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="FF" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                        FF
                      </ToggleGroupItem>
                      <ToggleGroupItem value="FE" className="data-[state=on]:bg-warning data-[state=on]:text-warning-foreground">
                        FE
                      </ToggleGroupItem>
                      <ToggleGroupItem value="FR" className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground">
                        FR
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {INVOICE_TYPE_LABELS[field.value as InvoiceType]}
                    {field.value === 'FR' && ' — diferența FF - FE, calculată automat'}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* FR Error Alert */}
            {isFR && frError && mode === 'add' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{frError}</AlertDescription>
              </Alert>
            )}

            {/* FR Calculating indicator */}
            {isFR && frCalculating && mode === 'add' && (
              <p className="text-sm text-muted-foreground animate-pulse">Se calculează regularizarea...</p>
            )}

            {/* Utility Select - show BEFORE supplier for FR so we can trigger calculation */}
            <FormField
              control={form.control}
              name="utilityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Utilitate</FormLabel>
                  {!showAddUtility ? (
                    <div className="space-y-2">
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
                          {utilities.map((utility) => (
                            <SelectItem key={utility.id} value={utility.id}>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={getUtilityColor(utility.id as UtilityType)}>
                                  {utility.name}
                                </Badge>
                                {utility.fullName}
                              </div>
                            </SelectItem>
                          ))}
                          {mode === 'add' && !isFR && (
                            <>
                              <Separator className="my-1" />
                              <div
                                className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary font-medium"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setShowAddUtility(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Adaugă utilitate nouă
                              </div>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Cod (ex: EE)"
                          value={newUtilityCode}
                          onChange={(e) => setNewUtilityCode(e.target.value)}
                          maxLength={5}
                        />
                        <Input
                          placeholder="Unitate măsură"
                          value={newUtilityUnit}
                          onChange={(e) => setNewUtilityUnit(e.target.value)}
                        />
                      </div>
                      <Input
                        placeholder="Denumire completă"
                        value={newUtilityName}
                        onChange={(e) => setNewUtilityName(e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="hasMeter"
                          checked={newUtilityHasMeter}
                          onChange={(e) => setNewUtilityHasMeter(e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="hasMeter" className="text-sm">Are contor</label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddNewUtility}
                          disabled={!newUtilityCode.trim() || !newUtilityName.trim()}
                        >
                          Salvează
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowAddUtility(false);
                            setNewUtilityCode('');
                            setNewUtilityName('');
                            setNewUtilityUnit('');
                            setNewUtilityHasMeter(false);
                          }}
                        >
                          Anulează
                        </Button>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Period Input MM.YY */}
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => {
                const displayValue = mode === 'view' 
                  ? formatPeriodToInput(field.value)
                  : undefined;
                const consumptionMonth = field.value 
                  ? formatPeriodDisplay(field.value) 
                  : null;

                return (
                  <FormItem>
                    <FormLabel>Perioada de consum</FormLabel>
                    {mode === 'view' ? (
                      <FormControl>
                        <Input value={displayValue} disabled />
                      </FormControl>
                    ) : (
                      <FormControl>
                        <Input
                          placeholder="MM.YY (ex: 03.26)"
                          defaultValue={formatPeriodToInput(field.value)}
                          onChange={(e) => {
                            const parsed = parsePeriodInput(e.target.value);
                            if (parsed) {
                              field.onChange(parsed);
                            } else if (e.target.value === '') {
                              field.onChange('');
                            }
                          }}
                          onBlur={(e) => {
                            const parsed = parsePeriodInput(e.target.value);
                            if (!parsed && e.target.value !== '') {
                              e.target.value = formatPeriodToInput(field.value);
                            }
                          }}
                        />
                      </FormControl>
                    )}
                    {consumptionMonth && (
                      <p className="text-xs text-muted-foreground">
                        Luna de consum: <span className="font-medium text-foreground">{consumptionMonth}</span>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Supplier Select - for FR this is auto-filled and disabled */}
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Furnizor</FormLabel>
                  {!showAddSupplier ? (
                    <div className="space-y-2">
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={mode === 'view' || isFR}
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
                          {mode === 'add' && !isFR && (
                            <>
                              <Separator className="my-1" />
                              <div
                                className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary font-medium"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setShowAddSupplier(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Adaugă furnizor nou
                              </div>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {isFR && mode === 'add' && (
                        <p className="text-xs text-muted-foreground">Moștenit automat de la Factura Furnizor (FF)</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                      <Input
                        placeholder="Denumire furnizor"
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                      />
                      <Input
                        placeholder="Nr. contract (opțional)"
                        value={newSupplierContract}
                        onChange={(e) => setNewSupplierContract(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddNewSupplier}
                          disabled={!newSupplierName.trim()}
                        >
                          Salvează
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowAddSupplier(false);
                            setNewSupplierName('');
                            setNewSupplierContract('');
                          }}
                        >
                          Anulează
                        </Button>
                      </div>
                    </div>
                  )}
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

            {/* === AC Sub-Lines Section === */}
            {isAC && !isFR ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Servicii A&C</h4>
                {acSubLines.map((line, idx) => (
                  <div key={line.code} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{line.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Consum ({line.unit})</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.consumption || ''}
                          onChange={(e) => handleAcSubLineChange(idx, 'consumption', Number(e.target.value) || 0)}
                          disabled={mode === 'view'}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Val. Netă (lei)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.netValue || ''}
                          onChange={(e) => handleAcSubLineChange(idx, 'netValue', Number(e.target.value) || 0)}
                          disabled={mode === 'view'}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">TVA (lei)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.vatValue || ''}
                          onChange={(e) => handleAcSubLineChange(idx, 'vatValue', Number(e.target.value) || 0)}
                          disabled={mode === 'view'}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        Total: <span className="font-medium text-foreground">
                          {line.totalValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei
                        </span>
                      </span>
                    </div>
                  </div>
                ))}

                {/* AC Summary */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  {acSubLines.map(line => (
                    <div key={line.code} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{line.name}:</span>
                      <span>{line.totalValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Net:</span>
                    <span className="font-medium">{acTotalNet.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total TVA:</span>
                    <span>{acTotalVat.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Factură A&C:</span>
                    <span className="text-xl font-bold text-primary">
                      {acTotalValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Standard fields for non-AC invoices (and FR) */}
                {/* Consumption */}
                <FormField
                  control={form.control}
                  name="totalConsumption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Consum {selectedUtility ? `(${selectedUtility.unit})` : ''}
                        {isFR && ' — diferență FF - FE'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          step="0.01"
                          placeholder="0"
                          disabled={mode === 'view' || isFR}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Net Value Taxable + TVA */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="netValueTaxable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Val. Netă Taxabilă (lei)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            step="0.01"
                            placeholder="0"
                            disabled={mode === 'view' || isFR}
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
                            disabled={mode === 'view' || isFR}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Net Value Exempt */}
                <FormField
                  control={form.control}
                  name="netValueExempt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Val. Netă Scutită TVA (lei)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          step="0.01"
                          placeholder="0"
                          disabled={mode === 'view' || isFR}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Servicii cu cotă TVA 0%
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Total summary */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Valoare Netă Taxabilă:</span>
                    <span className={netValueTaxable < 0 ? 'text-destructive' : ''}>
                      {formatValue(Number(netValueTaxable) || 0)} lei
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">TVA:</span>
                    <span className={vatValue < 0 ? 'text-destructive' : ''}>
                      {formatValue(Number(vatValue) || 0)} lei
                    </span>
                  </div>
                  {(Number(netValueExempt) || 0) !== 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Valoare Netă Scutită:</span>
                      <span className={netValueExempt < 0 ? 'text-destructive' : ''}>
                        {formatValue(Number(netValueExempt) || 0)} lei
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Net:</span>
                    <span className={`font-medium ${netValue < 0 ? 'text-destructive' : ''}`}>
                      {formatValue(netValue)} lei
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Factură:</span>
                    <span className={`text-xl font-bold ${totalValue < 0 ? 'text-destructive' : 'text-primary'}`}>
                      {formatValue(totalValue)} lei
                    </span>
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                {mode === 'view' ? 'Închide' : 'Anulează'}
              </Button>
              {mode === 'add' && (
                <Button type="submit" disabled={isFR && !!frError}>
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
