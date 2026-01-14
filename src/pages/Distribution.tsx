import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { consumptionDistributions, spaces, clients, supplierInvoices } from '@/data/mockData';
import { UTILITIES, UtilityType } from '@/types/utility';
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
import { Calculator, Play, Calendar, CheckCircle } from 'lucide-react';
import { UtilityType } from '@/types/utility';

const Distribution = () => {
  const [periodFilter, setPeriodFilter] = useState<string>('2025-12');
  const [utilityFilter, setUtilityFilter] = useState<string>('all');

  const distributionsWithDetails = consumptionDistributions.map(dist => {
    const space = spaces.find(s => s.id === dist.spaceId);
    const client = clients.find(c => c.id === dist.clientId);
    const utility = UTILITIES.find(u => u.id === dist.utilityType);
    const invoice = supplierInvoices.find(i => i.id === dist.invoiceId);
    
    return {
      ...dist,
      spaceName: space?.name || 'Necunoscut',
      clientName: client?.name || 'Necunoscut',
      utilityName: utility?.fullName || dist.utilityType,
      unit: utility?.unit || '',
      invoiceNumber: invoice?.invoiceNumber || '-',
    };
  });

  const filteredDistributions = distributionsWithDetails.filter(dist => {
    const matchesUtility = utilityFilter === 'all' || dist.utilityType === utilityFilter;
    const matchesPeriod = dist.period === periodFilter;
    
    return matchesUtility && matchesPeriod;
  });

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

  const getMethodBadge = (method: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      meter: { label: 'Index', color: 'bg-primary/10 text-primary' },
      area: { label: 'Suprafață', color: 'bg-accent/10 text-accent' },
      persons: { label: 'Persoane', color: 'bg-success/10 text-success' },
      percentage: { label: 'Procent', color: 'bg-warning/10 text-warning' },
    };
    const info = labels[method] || { label: method, color: 'bg-muted text-muted-foreground' };
    return <Badge variant="outline" className={info.color}>{info.label}</Badge>;
  };

  const totalDistributed = filteredDistributions.reduce((sum, d) => sum + d.totalValue, 0);

  // Group by utility for summary
  const summaryByUtility = UTILITIES.map(utility => {
    const utilityDists = filteredDistributions.filter(d => d.utilityType === utility.id);
    return {
      utility,
      consumption: utilityDists.reduce((sum, d) => sum + d.consumption, 0),
      value: utilityDists.reduce((sum, d) => sum + d.totalValue, 0),
    };
  }).filter(s => s.value > 0);

  return (
    <MainLayout title="Repartizare Consumuri" subtitle="Repartizarea facturilor de la furnizori către clienți">
      <div className="space-y-6 animate-slide-up">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredDistributions.length}</p>
                <p className="text-sm text-muted-foreground">Repartizări</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDistributed.toLocaleString('ro-RO')} lei</p>
                <p className="text-sm text-muted-foreground">Total Repartizat</p>
              </div>
            </div>
          </div>
          {summaryByUtility.slice(0, 2).map(summary => (
            <div key={summary.utility.id} className="utility-card">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${summary.utility.color}/10`}>
                  <span className={`text-sm font-bold text-${summary.utility.color}`}>{summary.utility.name}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.value.toLocaleString('ro-RO')} lei</p>
                  <p className="text-sm text-muted-foreground">{summary.consumption.toLocaleString('ro-RO')} {summary.utility.unit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-wrap">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Perioadă" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-12">Dec 2025</SelectItem>
                <SelectItem value="2025-11">Nov 2025</SelectItem>
                <SelectItem value="2025-10">Oct 2025</SelectItem>
              </SelectContent>
            </Select>
            <Select value={utilityFilter} onValueChange={setUtilityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Utilitate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate Utilitățile</SelectItem>
                {UTILITIES.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2">
            <Play className="w-4 h-4" />
            Calculează Repartizare
          </Button>
        </div>

        {/* Table */}
        <div className="utility-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Spațiu</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Utilitate</TableHead>
                <TableHead>Metodă</TableHead>
                <TableHead className="text-right">Consum</TableHead>
                <TableHead className="text-right">Valoare Netă</TableHead>
                <TableHead className="text-right">TVA</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDistributions.map((dist) => (
                <TableRow key={dist.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{dist.spaceName}</TableCell>
                  <TableCell>{dist.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getUtilityColor(dist.utilityType)}>
                      {dist.utilityType}
                    </Badge>
                  </TableCell>
                  <TableCell>{getMethodBadge(dist.distributionMethod)}</TableCell>
                  <TableCell className="text-right">
                    {dist.consumption.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {dist.unit}
                  </TableCell>
                  <TableCell className="text-right">{dist.netValue.toLocaleString('ro-RO')} lei</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {dist.vatValue.toLocaleString('ro-RO')} lei
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {dist.totalValue.toLocaleString('ro-RO')} lei
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Distribution;
