import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { clients, spaces } from '@/data/mockData';
import { db } from '@/lib/db';
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipboardList, Calendar, Eye, Printer, Download, FileText } from 'lucide-react';
import ConsumptionNoteDocument from '@/components/consumption-notes/ConsumptionNoteDocument';


const ConsumptionNotes = () => {
  const [periodFilter, setPeriodFilter] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [dbDistributions, setDbDistributions] = useState<any[]>([]);

  // Load available periods and distributions from DB
  useEffect(() => {
    const loadPeriods = async () => {
      const allDists = await db.distributions.toArray();
      const periods = [...new Set(allDists.map(d => d.period))] as string[];
      const sorted = periods.sort().reverse();
      setAvailablePeriods(sorted);
      if (sorted.length > 0 && !periodFilter) {
        setPeriodFilter(sorted[0]);
      }
    };
    loadPeriods();
  }, []);

  // Load distributions for selected period
  useEffect(() => {
    if (!periodFilter) return;
    const loadDistributions = async () => {
      const dists = await db.distributions.where('period').equals(periodFilter).toArray();
      setDbDistributions(dists);
    };
    loadDistributions();
  }, [periodFilter]);

  const clientNotes = clients.map(client => {
    const clientSpaces = spaces.filter(s => client.spaces.includes(s.id));
    const distributions = dbDistributions.filter(
      d => d.clientId === client.id
    );
    
    const byUtility = UTILITIES.reduce((acc, utility) => {
      const utilityDist = distributions.filter(d => d.utilityType === utility.id);
      acc[utility.id] = {
        consumption: utilityDist.reduce((sum, d) => sum + d.consumption, 0),
        value: utilityDist.reduce((sum, d) => sum + d.totalValue, 0),
      };
      return acc;
    }, {} as Record<UtilityType, { consumption: number; value: number }>);

    const total = distributions.reduce((sum, d) => sum + d.totalValue, 0);
    
    return {
      ...client,
      clientSpaces,
      byUtility,
      total,
      distributions,
    };
  }).filter(c => c.total > 0);

  const selectedClientData = selectedClient 
    ? clientNotes.find(c => c.id === selectedClient) 
    : null;

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
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

  return (
    <MainLayout title="Note de Consum" subtitle="Generarea notelor de consum pentru clienți">
      <div className="space-y-6 animate-slide-up">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clientNotes.length}</p>
                <p className="text-sm text-muted-foreground">Note de Generat</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clientNotes.reduce((sum, c) => sum + c.total, 0).toLocaleString('ro-RO')} lei
                </p>
                <p className="text-sm text-muted-foreground">Total de Refacturat</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold capitalize">{formatPeriod(periodFilter)}</p>
                <p className="text-sm text-muted-foreground">Perioada Selectată</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Perioadă" />
            </SelectTrigger>
            <SelectContent>
              {availablePeriods.map(period => (
                <SelectItem key={period} value={period}>
                  {formatPeriod(period)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Printer className="w-4 h-4" />
              Printează Toate
            </Button>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="utility-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Client</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Spații</TableHead>
                <TableHead className="text-right">EE</TableHead>
                <TableHead className="text-right">AC</TableHead>
                <TableHead className="text-right">GN</TableHead>
                <TableHead className="text-right">Alte Servicii</TableHead>
                <TableHead className="text-right">TOTAL</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientNotes.map((client) => {
                const otherServices = (client.byUtility.AA?.value || 0) + 
                  (client.byUtility.SM?.value || 0) + 
                  (client.byUtility.AS?.value || 0) +
                  (client.byUtility.SSV?.value || 0);
                
                return (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {client.name.split(' ')[1]?.[0] || client.name[0]}
                        </div>
                        <span className="font-medium">{client.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.type === 'PJ' ? 'default' : 'secondary'}>
                        {client.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.spaces.join(', ')}
                    </TableCell>
                    <TableCell className="text-right">
                      {client.byUtility.EE?.value > 0 
                        ? `${client.byUtility.EE.value.toLocaleString('ro-RO')} lei`
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      {client.byUtility.AC?.value > 0 
                        ? `${client.byUtility.AC.value.toLocaleString('ro-RO')} lei`
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      {client.byUtility.GN?.value > 0 
                        ? `${client.byUtility.GN.value.toLocaleString('ro-RO')} lei`
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      {otherServices > 0 
                        ? `${otherServices.toLocaleString('ro-RO')} lei`
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {client.total.toLocaleString('ro-RO')} lei
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedClient(client.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <ClipboardList className="w-5 h-5 text-primary" />
                              Notă de Consum - {client.name}
                            </DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[75vh] pr-4">
                            <ConsumptionNoteDocument 
                              client={client} 
                              period={periodFilter}
                            />
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
};

export default ConsumptionNotes;
