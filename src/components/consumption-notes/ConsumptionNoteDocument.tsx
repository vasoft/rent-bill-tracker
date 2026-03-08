import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, Building2, MapPin, Gauge } from 'lucide-react';
import { UTILITIES, UtilityType } from '@/types/utility';
import type { DbDistribution } from '@/lib/db';

interface ClientSpace {
  id: string;
  name: string;
  area: number;
  persons: number;
}

interface ClientData {
  id: string;
  name: string;
  type: 'PJ' | 'PF';
  spaces: string[];
  clientSpaces: ClientSpace[];
  total: number;
  distributions: DbDistribution[];
}

interface ConsumptionNoteDocumentProps {
  client: ClientData;
  period: string;
}

const formatNumber = (n: number, decimals = 2) =>
  n.toLocaleString('ro-RO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const getUtilityColor = (type: UtilityType) => {
  const colors: Record<UtilityType, string> = {
    EE: 'bg-blue-100 text-blue-700 border-blue-300',
    GN: 'bg-amber-100 text-amber-700 border-amber-300',
    AC: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    AA: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    SM: 'bg-purple-100 text-purple-700 border-purple-300',
    AS: 'bg-teal-100 text-teal-700 border-teal-300',
    SSV: 'bg-pink-100 text-pink-700 border-pink-300',
    SC: 'bg-orange-100 text-orange-700 border-orange-300',
  };
  return colors[type] || 'bg-muted text-muted-foreground';
};

const ConsumptionNoteDocument = ({ client, period }: ConsumptionNoteDocumentProps) => {
  const formatPeriod = (p: string) => {
    const [year, month] = p.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  };

  const distributions = client.distributions || [];

  // Build per-space data
  const spaceDetails = client.clientSpaces.map(space => {
    const spaceDists = distributions.filter(d => d.spaceId === space.id);
    const utilities = UTILITIES
      .map(u => {
        const dists = spaceDists.filter(d => d.utilityType === u.id);
        if (dists.length === 0) return null;
        const consumption = dists.reduce((s, d) => s + d.consumption, 0);
        const netValue = dists.reduce((s, d) => s + d.netValue, 0);
        const vatValue = dists.reduce((s, d) => s + d.vatValue, 0);
        const totalValue = dists.reduce((s, d) => s + d.totalValue, 0);
        if (totalValue === 0) return null;
        return { utilityType: u.id, utilityName: u.name, fullName: u.fullName, unit: u.unit, consumption, netValue, vatValue, totalValue };
      })
      .filter(Boolean) as { utilityType: UtilityType; utilityName: string; fullName: string; unit: string; consumption: number; netValue: number; vatValue: number; totalValue: number }[];

    const spaceNetTotal = utilities.reduce((s, u) => s + u.netValue, 0);
    const spaceVatTotal = utilities.reduce((s, u) => s + u.vatValue, 0);
    const spaceTotalValue = utilities.reduce((s, u) => s + u.totalValue, 0);

    return { ...space, utilities, spaceNetTotal, spaceVatTotal, spaceTotalValue };
  }).filter(s => s.utilities.length > 0);

  // Grand totals
  const grandNet = spaceDetails.reduce((s, sp) => s + sp.spaceNetTotal, 0);
  const grandVat = spaceDetails.reduce((s, sp) => s + sp.spaceVatTotal, 0);
  const grandTotal = spaceDetails.reduce((s, sp) => s + sp.spaceTotalValue, 0);

  // Summary by utility
  const summaryByUtility = UTILITIES.map(u => {
    const uDists = distributions.filter(d => d.utilityType === u.id);
    if (uDists.length === 0) return null;
    const consumption = uDists.reduce((s, d) => s + d.consumption, 0);
    const netValue = uDists.reduce((s, d) => s + d.netValue, 0);
    const vatValue = uDists.reduce((s, d) => s + d.vatValue, 0);
    const totalValue = uDists.reduce((s, d) => s + d.totalValue, 0);
    if (totalValue === 0) return null;
    return { ...u, consumption, netValue, vatValue, totalValue };
  }).filter(Boolean) as (typeof UTILITIES[number] & { consumption: number; netValue: number; vatValue: number; totalValue: number })[];

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 print:p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-foreground print:text-xl">NOTĂ DE CONSUM</h2>
            <p className="text-muted-foreground">Utilități și Servicii</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold capitalize">{formatPeriod(period)}</p>
            <p className="text-sm text-muted-foreground">Data emiterii: {new Date().toLocaleDateString('ro-RO')}</p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg print:p-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="w-4 h-4" />
            <span className="font-semibold">Client</span>
          </div>
          <p className="text-lg font-bold">{client.name}</p>
          <Badge variant={client.type === 'PJ' ? 'default' : 'secondary'}>
            {client.type === 'PJ' ? 'Persoană Juridică' : 'Persoană Fizică'}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <MapPin className="w-4 h-4" />
            <span className="font-semibold">Spații Închiriate</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {client.clientSpaces.map(space => (
              <Badge key={space.id} variant="outline" className="text-xs">
                {space.name} ({space.area} mp)
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed per Space */}
      {spaceDetails.map(space => (
        <div key={space.id} className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{space.name}</p>
                <p className="text-xs text-muted-foreground">{space.area} mp • {space.persons} {space.persons === 1 ? 'persoană' : 'persoane'}</p>
              </div>
            </div>
            <p className="font-bold text-lg">{formatNumber(space.spaceTotalValue)} lei</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-xs">
                <TableHead>Utilitate / Serviciu</TableHead>
                <TableHead className="text-right">Consum</TableHead>
                <TableHead className="text-right">Val. Netă (lei)</TableHead>
                <TableHead className="text-right">TVA (lei)</TableHead>
                <TableHead className="text-right font-bold">Total (lei)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {space.utilities.map(u => (
                <TableRow key={u.utilityType} className="text-sm">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${getUtilityColor(u.utilityType)}`}>
                        {u.utilityName}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{u.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(u.consumption)} {u.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(u.netValue)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatNumber(u.vatValue)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatNumber(u.totalValue)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Space totals row */}
              <TableRow className="bg-muted/30 border-t-2 border-primary/20">
                <TableCell className="font-bold" colSpan={2}>TOTAL {space.name}</TableCell>
                <TableCell className="text-right font-bold">{formatNumber(space.spaceNetTotal)}</TableCell>
                <TableCell className="text-right font-bold">{formatNumber(space.spaceVatTotal)}</TableCell>
                <TableCell className="text-right font-bold text-primary">{formatNumber(space.spaceTotalValue)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ))}

      {/* Summary by Utility */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-primary/10 px-4 py-3">
          <p className="font-semibold text-primary">Sumar pe Utilități</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Utilitate / Serviciu</TableHead>
              <TableHead className="text-right">Consum Total</TableHead>
              <TableHead className="text-right">Val. Netă (lei)</TableHead>
              <TableHead className="text-right">TVA (lei)</TableHead>
              <TableHead className="text-right font-bold">Total (lei)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaryByUtility.map(u => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getUtilityColor(u.id)}>
                      {u.name}
                    </Badge>
                    <span className="text-sm">{u.fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(u.consumption)} {u.unit}
                </TableCell>
                <TableCell className="text-right">{formatNumber(u.netValue)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatNumber(u.vatValue)}</TableCell>
                <TableCell className="text-right font-semibold">{formatNumber(u.totalValue)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-primary/5 border-t-2 border-primary/20">
              <TableCell colSpan={2} className="text-right font-bold text-lg">TOTAL DE PLATĂ:</TableCell>
              <TableCell className="text-right font-bold text-lg">{formatNumber(grandNet)}</TableCell>
              <TableCell className="text-right font-bold text-lg">{formatNumber(grandVat)}</TableCell>
              <TableCell className="text-right font-bold text-xl text-primary">{formatNumber(grandTotal)} lei</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-border print:hidden">
        <p className="text-xs text-muted-foreground">
          Document generat automat de OFF-GUS • {new Date().toLocaleString('ro-RO')}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Printează
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Descarcă PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConsumptionNoteDocument;
