import { clients, getClientTotalByPeriod, consumptionDistributions } from '@/data/mockData';
import { UTILITIES, UtilityType } from '@/types/utility';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const ClientsTable = () => {
  const currentPeriod = '2025-12';
  
  const clientData = clients.map(client => {
    const distributions = consumptionDistributions.filter(
      cd => cd.clientId === client.id && cd.period === currentPeriod
    );
    
    const byUtility = UTILITIES.reduce((acc, utility) => {
      const utilityDist = distributions.filter(d => d.utilityType === utility.id);
      acc[utility.id] = utilityDist.reduce((sum, d) => sum + d.totalValue, 0);
      return acc;
    }, {} as Record<UtilityType, number>);
    
    const total = getClientTotalByPeriod(client.id, currentPeriod);
    
    return {
      ...client,
      byUtility,
      total,
    };
  }).sort((a, b) => b.total - a.total);

  const formatValue = (value: number) => {
    if (value === 0) return '-';
    return value.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="utility-card overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Consumuri pe Clienți</h3>
        <Badge variant="secondary" className="text-xs">
          Decembrie 2025
        </Badge>
      </div>
      <div className="overflow-x-auto -mx-5 px-5">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Client</TableHead>
              <TableHead className="text-right font-semibold text-chart-ee">EE</TableHead>
              <TableHead className="text-right font-semibold text-chart-ac">AC</TableHead>
              <TableHead className="text-right font-semibold text-chart-gn">GN</TableHead>
              <TableHead className="text-right font-semibold text-chart-aa">AA</TableHead>
              <TableHead className="text-right font-semibold text-chart-sm">SM</TableHead>
              <TableHead className="text-right font-semibold">TOTAL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientData.map((client) => (
              <TableRow key={client.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {client.name.split(' ')[1]?.[0] || client.name[0]}
                    </div>
                    <div>
                      <div className="text-sm">{client.name}</div>
                      <div className="text-xs text-muted-foreground">{client.type}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm">{formatValue(client.byUtility.EE)}</TableCell>
                <TableCell className="text-right text-sm">{formatValue(client.byUtility.AC)}</TableCell>
                <TableCell className="text-right text-sm">{formatValue(client.byUtility.GN)}</TableCell>
                <TableCell className="text-right text-sm">{formatValue(client.byUtility.AA)}</TableCell>
                <TableCell className="text-right text-sm">{formatValue(client.byUtility.SM)}</TableCell>
                <TableCell className="text-right font-semibold text-sm">
                  {formatValue(client.total)} lei
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientsTable;
