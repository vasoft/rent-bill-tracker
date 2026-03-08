import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/db';
import { spaces, clients } from '@/data/mockData';
import { AcSubLine } from '@/types/utility';
import { type CurrentMonthRow } from '@/hooks/use-utilities-db';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Droplets, AlertTriangle } from 'lucide-react';

interface AcTableProps {
  currentMonthData: CurrentMonthRow[];
  currentPeriod: string;
  calculationType: 'consumption' | 'value';
  isInitialized: boolean;
  onEditIndex: (row: CurrentMonthRow) => void;
}

const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });

export default function AcTable({ currentMonthData, currentPeriod, calculationType, isInitialized, onEditIndex }: AcTableProps) {
  const [acSubLines, setAcSubLines] = useState<AcSubLine[]>([]);

  // Load AC invoice sub-lines
  useEffect(() => {
    const load = async () => {
      const invoices = await db.supplierInvoices
        .where('[utilityType+period]')
        .equals(['AC', currentPeriod])
        .toArray();
      if (invoices.length > 0 && invoices[0].acSubLinesJson) {
        setAcSubLines(JSON.parse(invoices[0].acSubLinesJson));
      } else {
        setAcSubLines([]);
      }
    };
    load();
  }, [currentPeriod, currentMonthData]);

  const acRows = useMemo(() => currentMonthData.filter(r => r.utilityType === 'AC'), [currentMonthData]);

  // Build comprehensive AC distribution data
  const acSpaceData = useMemo(() => {
    const occupiedSpaces = spaces.filter(s => s.clientId !== null);

    const aaInvoice = acSubLines.find(l => l.code === 'AC-AA');
    const amInvoice = acSubLines.find(l => l.code === 'AC-AM');

    const invoicedAaConsumption = aaInvoice?.consumption || 0;
    const invoicedAmConsumption = amInvoice?.consumption || 0;

    const spaceRows = occupiedSpaces.map(space => {
      const client = clients.find(c => c.id === space.clientId);
      const acRow = acRows.find(r => r.spaceId === space.id);
      const hasMeter = space.racordAA !== '';

      return {
        space,
        client,
        acRow,
        hasMeter,
        meteredConsumption: hasMeter && acRow ? acRow.consumption : 0,
      };
    });

    // Total metered consumption for Alimentare cu apă
    const totalMeteredAa = spaceRows
      .filter(r => r.hasMeter)
      .reduce((sum, r) => sum + r.meteredConsumption, 0);

    // If no metered consumption exists, distribute entire invoiced qty to ALL spaces by persons
    const hasMeteredConsumption = totalMeteredAa > 0;
    const totalPersonsAll = spaceRows.reduce((sum, r) => sum + r.space.persons, 0);

    let aaCsp = 0;
    if (!hasMeteredConsumption) {
      // No metered data: distribute everything by persons to all spaces
      aaCsp = totalPersonsAll > 0 ? invoicedAaConsumption / totalPersonsAll : 0;
    } else {
      // Has metered data: distribute remainder to non-metered spaces
      const nonMeteredSpaces = spaceRows.filter(r => !r.hasMeter);
      const totalPersonsNonMetered = nonMeteredSpaces.reduce((sum, r) => sum + r.space.persons, 0);
      const aaDifference = Math.max(0, invoicedAaConsumption - totalMeteredAa);
      aaCsp = totalPersonsNonMetered > 0 ? aaDifference / totalPersonsNonMetered : 0;
    }

    // Ape meteorice: Csp = invoiced / total area
    const totalArea = spaceRows.reduce((sum, r) => sum + r.space.area, 0);
    const amCsp = totalArea > 0 ? invoicedAmConsumption / totalArea : 0;

    return spaceRows.map(r => {
      let alimentareApa: number;
      if (!hasMeteredConsumption) {
        // All spaces get distribution by persons
        alimentareApa = r.space.persons * aaCsp;
      } else {
        alimentareApa = r.hasMeter ? r.meteredConsumption : r.space.persons * aaCsp;
      }
      const canalizare = alimentareApa;
      const apeMeteorie = r.space.area * amCsp;
      const taxa = canalizare + apeMeteorie;
      const consumTotal = canalizare + apeMeteorie;

      return {
        spaceId: r.space.id,
        spaceName: r.space.name,
        area: r.space.area,
        clientName: r.client?.name || 'Necunoscut',
        persons: r.space.persons,
        hasMeter: r.hasMeter,
        alimentareApa,
        canalizare,
        apeMeteorie,
        taxa,
        consumTotal,
        currentMonthRow: r.acRow,
      };
    });
  }, [acRows, acSubLines]);

  // Value table data
  const acValueData = useMemo(() => {
    if (calculationType !== 'value') return [];

    const aaInv = acSubLines.find(l => l.code === 'AC-AA');
    const cnInv = acSubLines.find(l => l.code === 'AC-CN');
    const amInv = acSubLines.find(l => l.code === 'AC-AM');
    const txInv = acSubLines.find(l => l.code === 'AC-TX');

    const totalAa = acSpaceData.reduce((s, r) => s + r.alimentareApa, 0);
    const totalCn = acSpaceData.reduce((s, r) => s + r.canalizare, 0);
    const totalAm = acSpaceData.reduce((s, r) => s + r.apeMeteorie, 0);
    const totalTx = acSpaceData.reduce((s, r) => s + r.taxa, 0);

    return acSpaceData.map(row => {
      const aaProp = totalAa > 0 ? row.alimentareApa / totalAa : 0;
      const cnProp = totalCn > 0 ? row.canalizare / totalCn : 0;
      const amProp = totalAm > 0 ? row.apeMeteorie / totalAm : 0;
      const txProp = totalTx > 0 ? row.taxa / totalTx : 0;

      const aaNet = (aaInv?.netValue || 0) * aaProp;
      const aaVat = (aaInv?.vatValue || 0) * aaProp;
      const cnNet = (cnInv?.netValue || 0) * cnProp;
      const cnVat = (cnInv?.vatValue || 0) * cnProp;
      const amNet = (amInv?.netValue || 0) * amProp;
      const amVat = (amInv?.vatValue || 0) * amProp;
      const txNet = (txInv?.netValue || 0) * txProp;
      const txVat = (txInv?.vatValue || 0) * txProp;

      const valoareNeta = aaNet + cnNet + amNet + txNet;
      const valoareTva = aaVat + cnVat + amVat + txVat;

      return {
        ...row,
        aaNet, cnNet, amNet, txNet,
        aaVat, cnVat, amVat, txVat,
        valoareNeta,
        valoareTva,
        valoareTotala: valoareNeta + valoareTva,
      };
    });
  }, [acSpaceData, acSubLines, calculationType]);

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
    // Totals row
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
