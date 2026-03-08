import { UtilityType, UTILITIES } from '@/types/utility';
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

const UTILITY_COLORS: Record<UtilityType, string> = {
  EE: 'text-chart-ee',
  GN: 'text-chart-gn',
  AC: 'text-chart-ac',
  AA: 'text-chart-aa',
  AS: 'text-chart-as',
  SM: 'text-chart-sm',
  SSV: 'text-chart-ssv',
  SC: 'text-chart-sc',
};

const ClientsTable = ({ data, periodLabel }: ClientsTableProps) => {
  const formatValue = (value: number) => {
    if (value === 0) return '-';
    return value.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="utility-card overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Costuri pe Clienți</h3>
        <Badge variant="secondary" className="text-xs">{periodLabel}</Badge>
      </div>
      <div className="overflow-x-auto -mx-5 px-5">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Client</TableHead>
              {UTILITIES.map(u => (
                <TableHead key={u.id} className={`text-right font-semibold text-xs ${UTILITY_COLORS[u.id]}`}>
                  {u.id}
                </TableHead>
              ))}
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
                {UTILITIES.map(u => (
                  <TableCell key={u.id} className="text-right text-xs">
                    {formatValue(client.byUtility[u.id] || 0)}
                  </TableCell>
                ))}
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
