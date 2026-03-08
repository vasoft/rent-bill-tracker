import { UtilityType } from '@/types/utility';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ClientRow {
  clientId: string;
  clientName: string;
  clientType: string;
  byUtility: Record<UtilityType, number>;
  total: number;
}

interface ClientsTableProps {
  data: ClientRow[];
  periodLabel: string;
}

const ClientsTable = ({ data, periodLabel }: ClientsTableProps) => {
  const formatValue = (value: number) => {
    if (value === 0) return '-';
    return value.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="utility-card overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Consumuri pe Clienți</h3>
        <Badge variant="secondary" className="text-xs">{periodLabel}</Badge>
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
            {data.map((client) => (
              <TableRow key={client.clientId} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {client.clientName.split(' ')[1]?.[0] || client.clientName[0]}
                    </div>
                    <div>
                      <div className="text-sm">{client.clientName}</div>
                      <div className="text-xs text-muted-foreground">{client.clientType}</div>
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
