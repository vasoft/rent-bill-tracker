import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { suppliers as initialSuppliers } from '@/data/mockData';
import { db } from '@/lib/db';
import { UTILITIES, UtilityType, SupplierInvoice, Supplier, UtilityInfo } from '@/types/utility';
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
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Search, FileText, Eye } from 'lucide-react';
import InvoiceForm from '@/components/invoices/InvoiceForm';

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [utilityFilter, setUtilityFilter] = useState<string>('all');
  const [invoicesList, setInvoicesList] = useState<SupplierInvoice[]>([]);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(initialSuppliers);
  const [utilitiesList, setUtilitiesList] = useState<UtilityInfo[]>([...UTILITIES]);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'view'>('add');
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);

  // Load invoices from Dexie on mount
  useEffect(() => {
    db.supplierInvoices.toArray().then(dbInvoices => {
      setInvoicesList(dbInvoices.map(inv => ({
        id: inv.externalId,
        supplierId: inv.supplierId,
        utilityType: inv.utilityType,
        period: inv.period,
        invoiceNumber: inv.invoiceNumber,
        issueDate: inv.issueDate,
        indexNew: inv.indexNew,
        indexOld: inv.indexOld,
        constant: inv.constant,
        pcs: inv.pcs,
        totalConsumption: inv.totalConsumption,
        netValueTaxable: inv.netValueTaxable ?? inv.netValue,
        netValueExempt: inv.netValueExempt ?? 0,
        netValue: inv.netValue,
        vatRate: inv.vatRate,
        vatValue: inv.vatValue,
        totalValue: inv.totalValue,
      })));
    });
  }, []);

  const invoicesWithDetails = invoicesList.map(invoice => {
    const supplier = suppliersList.find(s => s.id === invoice.supplierId);
    const utility = utilitiesList.find(u => u.id === invoice.utilityType);
    
    return {
      ...invoice,
      supplierName: supplier?.name || 'Necunoscut',
      utilityName: utility?.fullName || invoice.utilityType,
      unit: utility?.unit || '',
    };
  });

  const filteredInvoices = invoicesWithDetails.filter(invoice => {
    const matchesSearch = invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUtility = utilityFilter === 'all' || invoice.utilityType === utilityFilter;
    
    return matchesSearch && matchesUtility;
  });

  const totalValue = filteredInvoices.reduce((sum, inv) => sum + inv.totalValue, 0);
  const totalVat = filteredInvoices.reduce((sum, inv) => sum + inv.vatValue, 0);

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

  const handleAddClick = () => {
    setSelectedInvoice(null);
    setFormMode('add');
    setFormOpen(true);
  };

  const handleViewClick = (invoice: SupplierInvoice) => {
    setSelectedInvoice(invoice);
    setFormMode('view');
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: {
    invoiceNumber: string;
    supplierId: string;
    utilityType: string;
    period: string;
    totalConsumption: number;
    netValueTaxable: number;
    netValueExempt: number;
    vatRate: number;
    vatValue: number;
  }) => {
    const externalId = `INV${Date.now()}`;
    const netValue = data.netValueTaxable + data.netValueExempt;
    const newInvoice: SupplierInvoice = {
      id: externalId,
      supplierId: data.supplierId,
      utilityType: data.utilityType as UtilityType,
      period: data.period,
      invoiceNumber: data.invoiceNumber,
      issueDate: new Date().toISOString().split('T')[0],
      totalConsumption: data.totalConsumption,
      netValueTaxable: data.netValueTaxable,
      netValueExempt: data.netValueExempt,
      netValue,
      vatRate: data.vatRate,
      vatValue: data.vatValue,
      totalValue: netValue + data.vatValue,
    };
    await db.supplierInvoices.add({
      externalId,
      supplierId: data.supplierId,
      utilityType: data.utilityType as UtilityType,
      period: data.period,
      invoiceNumber: data.invoiceNumber,
      issueDate: newInvoice.issueDate,
      totalConsumption: data.totalConsumption,
      netValueTaxable: data.netValueTaxable,
      netValueExempt: data.netValueExempt,
      netValue,
      vatRate: data.vatRate,
      vatValue: data.vatValue,
      totalValue: newInvoice.totalValue,
    });
    setInvoicesList(prev => [...prev, newInvoice]);
  };

  const handleAddSupplier = (supplierData: Omit<Supplier, 'id'>): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `FR${Date.now()}`,
    };
    setSuppliersList(prev => [...prev, newSupplier]);
    return newSupplier;
  };

  const handleAddUtility = (utilityData: Omit<UtilityInfo, 'id'>): UtilityInfo => {
    const newUtility: UtilityInfo = {
      ...utilityData,
      id: utilityData.name as UtilityType,
    };
    setUtilitiesList(prev => [...prev, newUtility]);
    return newUtility;
  };

  const existingPeriods = [...new Set(invoicesList.map(inv => inv.period))];

  return (
    <MainLayout title="Facturi Furnizori" subtitle="Gestionarea facturilor de la furnizori">
      <div className="space-y-6 animate-slide-up">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredInvoices.length}</p>
                <p className="text-sm text-muted-foreground">Facturi Înregistrate</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalValue.toLocaleString('ro-RO')} lei</p>
                <p className="text-sm text-muted-foreground">Total cu TVA</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVat.toLocaleString('ro-RO')} lei</p>
                <p className="text-sm text-muted-foreground">TVA Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Caută furnizor sau factură..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={utilityFilter} onValueChange={setUtilityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Utilitate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate Utilitățile</SelectItem>
                {utilitiesList.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2" onClick={handleAddClick}>
            <Plus className="w-4 h-4" />
            Adaugă Factură
          </Button>
        </div>

        {/* Table */}
        <div className="utility-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nr. Factură</TableHead>
                <TableHead>Furnizor</TableHead>
                <TableHead>Utilitate</TableHead>
                <TableHead>Perioadă</TableHead>
                <TableHead className="text-right">Consum</TableHead>
                <TableHead className="text-right">Valoare Netă</TableHead>
                <TableHead className="text-right">TVA</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                  <TableCell className="font-medium">{invoice.supplierName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getUtilityColor(invoice.utilityType)}>
                      {invoice.utilityType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.period + '-01').toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.totalConsumption > 0 
                      ? `${invoice.totalConsumption.toLocaleString('ro-RO')} ${invoice.unit}`
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">{invoice.netValue.toLocaleString('ro-RO')} lei</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {invoice.vatValue.toLocaleString('ro-RO')} lei ({invoice.vatRate}%)
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {invoice.totalValue.toLocaleString('ro-RO')} lei
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleViewClick(invoice)}
                      title="Vizualizează factura"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Invoice Form Modal */}
        <InvoiceForm
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          invoice={selectedInvoice}
          suppliers={suppliersList}
          utilities={utilitiesList}
          existingPeriods={existingPeriods}
          onSubmit={handleFormSubmit}
          onAddSupplier={handleAddSupplier}
          onAddUtility={handleAddUtility}
        />
      </div>
    </MainLayout>
  );
};

export default Invoices;
