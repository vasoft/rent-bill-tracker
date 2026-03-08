import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Droplets, AlertTriangle } from 'lucide-react';
import { type CurrentMonthRow } from '@/hooks/use-utilities-db';
import { type AcSpaceRow, type AcValueRow } from '@/hooks/use-ac-distribution';

interface AcTableProps {
  acSpaceData: AcSpaceRow[];
  acValueData: AcValueRow[];
  acSubLines: { code: string }[];
  calculationType: 'consumption' | 'value';
  isInitialized: boolean;
  onEditIndex: (row: CurrentMonthRow) => void;
}

const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });

export default function AcTable({ acSpaceData, acValueData, acSubLines, calculationType, isInitialized, onEditIndex }: AcTableProps) {
  if (!isInitialized) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
              Apăsați "Inițializare Consum" pentru a începe înregistrarea
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  const hasSubLines = acSubLines.length > 0;

  if (calculationType === 'consumption') {
    const totals = acSpaceData.reduce(
      (acc, r) => ({
        alimentareApa: acc.alimentareApa + r.alimentareApa,
        canalizare: acc.canalizare + r.canalizare,
        apeMeteorie: acc.apeMeteorie + r.apeMeteorie,
        taxa: acc.taxa + r.taxa,
        consumTotal: acc.consumTotal + r.consumTotal,
      }),
      { alimentareApa: 0, canalizare: 0, apeMeteorie: 0, taxa: 0, consumTotal: 0 }
    );

    return (
      <div className="space-y-2">
        {!hasSubLines && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/30 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Factura A&C nu conține sub-servicii detaliate. Adăugați o factură A&C cu sub-linii pentru repartizare completă.
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Spațiu</TableHead>
              <TableHead className="text-right">Suprafață (mp)</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Persoane</TableHead>
              <TableHead>Util/Serv</TableHead>
              <TableHead className="text-right">Alim. apă (mc)</TableHead>
              <TableHead className="text-right">Canalizare (mc)</TableHead>
              <TableHead className="text-right">Ape met. (mc)</TableHead>
              <TableHead className="text-right">Taxă (mc)</TableHead>
              <TableHead className="text-right">Consum total</TableHead>
              <TableHead className="w-[60px]">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {acSpaceData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                  Nu există date A&C
                </TableCell>
              </TableRow>
            ) : (
              acSpaceData.map(row => (
                <TableRow key={row.spaceId} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{row.spaceName}</TableCell>
                  <TableCell className="text-right">{row.area}</TableCell>
                  <TableCell>{row.clientName}</TableCell>
                  <TableCell className="text-right">{row.persons}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1.5 bg-chart-ac/10 text-chart-ac border-chart-ac/30">
                      <Droplets className="w-4 h-4" />
                      A&C
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.alimentareApa > 0 ? fmt(row.alimentareApa) : '-'}
                    {row.hasMeter && <span className="text-xs text-muted-foreground ml-1">(C)</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.canalizare > 0 ? fmt(row.canalizare) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.apeMeteorie > 0 ? fmt(row.apeMeteorie) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.taxa > 0 ? fmt(row.taxa) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold font-mono">
                    {row.consumTotal > 0 ? fmt(row.consumTotal) : '-'}
                  </TableCell>
                  <TableCell>
                    {row.hasMeter && row.currentMonthRow && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditIndex(row.currentMonthRow!)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {acSpaceData.length > 0 && (
            <TableFooter>
              <TableRow className="font-semibold bg-muted/50">
                <TableCell colSpan={5} className="text-right">TOTAL</TableCell>
                <TableCell className="text-right font-mono">{fmt(totals.alimentareApa)}</TableCell>
                <TableCell className="text-right font-mono">{fmt(totals.canalizare)}</TableCell>
                <TableCell className="text-right font-mono">{fmt(totals.apeMeteorie)}</TableCell>
                <TableCell className="text-right font-mono">{fmt(totals.taxa)}</TableCell>
                <TableCell className="text-right font-mono">{fmt(totals.consumTotal)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    );
  }

  // VALUE TABLE
  const valueTotals = acValueData.reduce(
    (acc, r) => ({
      aaNet: acc.aaNet + r.aaNet,
      cnNet: acc.cnNet + r.cnNet,
      amNet: acc.amNet + r.amNet,
      txNet: acc.txNet + r.txNet,
      valoareNeta: acc.valoareNeta + r.valoareNeta,
      valoareTva: acc.valoareTva + r.valoareTva,
      valoareTotala: acc.valoareTotala + r.valoareTotala,
    }),
    { aaNet: 0, cnNet: 0, amNet: 0, txNet: 0, valoareNeta: 0, valoareTva: 0, valoareTotala: 0 }
  );

  return (
    <div className="space-y-2">
      {!hasSubLines && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/30 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Factura A&C nu conține sub-servicii detaliate. Valorile nu pot fi repartizate.
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Spațiu</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Util/Serv</TableHead>
            <TableHead className="text-right">Alim. apă (lei)</TableHead>
            <TableHead className="text-right">Canalizare (lei)</TableHead>
            <TableHead className="text-right">Ape met. (lei)</TableHead>
            <TableHead className="text-right">Taxă (lei)</TableHead>
            <TableHead className="text-right">Valoare netă</TableHead>
            <TableHead className="text-right">Valoare TVA</TableHead>
            <TableHead className="text-right">Valoare totală</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {acValueData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                Nu există date A&C sau factură cu sub-servicii
              </TableCell>
            </TableRow>
          ) : (
            acValueData.map(row => (
              <TableRow key={row.spaceId} className="hover:bg-muted/50">
                <TableCell className="font-medium">{row.spaceName}</TableCell>
                <TableCell>{row.clientName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1.5 bg-chart-ac/10 text-chart-ac border-chart-ac/30">
                    <Droplets className="w-4 h-4" />
                    A&C
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {row.aaNet > 0 ? fmt(row.aaNet) : '-'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {row.cnNet > 0 ? fmt(row.cnNet) : '-'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {row.amNet > 0 ? fmt(row.amNet) : '-'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {row.txNet > 0 ? fmt(row.txNet) : '-'}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {row.valoareNeta > 0 ? `${fmt(row.valoareNeta)} lei` : '-'}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {row.valoareTva > 0 ? `${fmt(row.valoareTva)} lei` : '-'}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {row.valoareTotala > 0 ? `${fmt(row.valoareTotala)} lei` : '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {acValueData.length > 0 && (
          <TableFooter>
            <TableRow className="font-semibold bg-muted/50">
              <TableCell colSpan={3} className="text-right">TOTAL</TableCell>
              <TableCell className="text-right font-mono">{fmt(valueTotals.aaNet)}</TableCell>
              <TableCell className="text-right font-mono">{fmt(valueTotals.cnNet)}</TableCell>
              <TableCell className="text-right font-mono">{fmt(valueTotals.amNet)}</TableCell>
              <TableCell className="text-right font-mono">{fmt(valueTotals.txNet)}</TableCell>
              <TableCell className="text-right font-mono">{fmt(valueTotals.valoareNeta)} lei</TableCell>
              <TableCell className="text-right font-mono">{fmt(valueTotals.valoareTva)} lei</TableCell>
              <TableCell className="text-right font-mono">{fmt(valueTotals.valoareTotala)} lei</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
