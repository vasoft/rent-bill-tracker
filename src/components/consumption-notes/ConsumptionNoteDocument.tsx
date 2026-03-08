import { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Printer, Download, Building2, MapPin, Gauge } from 'lucide-react';
import { UTILITIES, UtilityType, MeterReading, ConsumptionDistribution } from '@/types/utility';
import { meterReadings, spaces, consumptionDistributions, supplierInvoices } from '@/data/mockData';

interface ClientData {
  id: string;
  name: string;
  type: 'PJ' | 'PF';
  spaces: string[];
  clientSpaces: { id: string; name: string; area: number; persons: number }[];
  total: number;
}

interface ConsumptionNoteDocumentProps {
  client: ClientData;
  period: string;
}

const ConsumptionNoteDocument = ({ client, period }: ConsumptionNoteDocumentProps) => {
  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  };

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

  // Get meter readings for client's spaces in this period
  const getSpaceMeterReading = (spaceId: string, utilityType: UtilityType): MeterReading | undefined => {
    return meterReadings.find(
      mr => mr.spaceId === spaceId && mr.utilityType === utilityType && mr.period === period
    );
  };

  // Get distribution for a space and utility
  const getDistribution = (spaceId: string, utilityType: UtilityType): ConsumptionDistribution | undefined => {
    return consumptionDistributions.find(
      cd => cd.spaceId === spaceId && cd.utilityType === utilityType && 
            cd.period === period && cd.clientId === client.id
    );
  };

  // Get invoice for utility type
  const getInvoiceForUtility = (utilityType: UtilityType) => {
    return supplierInvoices.find(inv => inv.utilityType === utilityType && inv.period === period);
  };

  // Calculate price per unit from invoice
  const getPricePerUnit = (utilityType: UtilityType): number => {
    const invoice = getInvoiceForUtility(utilityType);
    if (invoice && invoice.totalConsumption > 0) {
      return invoice.netValue / invoice.totalConsumption;
    }
    return 0;
  };

  // Build detailed data per space
  const spaceDetails = client.clientSpaces.map(space => {
    const utilities = UTILITIES.map(utility => {
      const reading = getSpaceMeterReading(space.id, utility.id);
      const distribution = getDistribution(space.id, utility.id);
      const pricePerUnit = getPricePerUnit(utility.id);

      if (!distribution || distribution.totalValue === 0) return null;

      return {
        utilityType: utility.id,
        utilityName: utility.name,
        utilityFullName: utility.fullName,
        unit: utility.unit,
        hasMeter: utility.hasMeter,
        indexOld: reading?.indexOld,
        indexNew: reading?.indexNew,
        constant: reading?.constant,
        pcs: reading?.pcs,
        consumption: distribution.consumption,
        pricePerUnit,
        netValue: distribution.netValue,
        vatValue: distribution.vatValue,
        totalValue: distribution.totalValue,
        distributionMethod: distribution.distributionMethod,
      };
    }).filter(Boolean);

    const spaceTotal = utilities.reduce((sum, u) => sum + (u?.totalValue || 0), 0);

    return {
      ...space,
      utilities,
      spaceTotal,
    };
  });

  // Grand totals by utility
  const grandTotalsByUtility = UTILITIES.map(utility => {
    let totalConsumption = 0;
    let totalNet = 0;
    let totalVat = 0;
    let totalValue = 0;

    spaceDetails.forEach(space => {
      const u = space.utilities.find(ut => ut?.utilityType === utility.id);
      if (u) {
        totalConsumption += u.consumption;
        totalNet += u.netValue;
        totalVat += u.vatValue;
        totalValue += u.totalValue;
      }
    });

    if (totalValue === 0) return null;

    return {
      ...utility,
      totalConsumption,
      totalNet,
      totalVat,
      totalValue,
    };
  }).filter(Boolean);

  const grandTotal = grandTotalsByUtility.reduce((sum, u) => sum + (u?.totalValue || 0), 0);

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      meter: 'Contor',
      area: 'Suprafață',
      persons: 'Persoane',
      percentage: 'Procent',
    };
    return labels[method] || method;
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Document Header */}
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

      {/* Detailed Consumption per Space */}
      {spaceDetails.map(space => (
        space.utilities.length > 0 && (
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
              <p className="font-bold text-lg">{space.spaceTotal.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei</p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs">
                  <TableHead className="w-[140px]">Utilitate</TableHead>
                  <TableHead className="text-center">Index Vechi</TableHead>
                  <TableHead className="text-center">Index Nou</TableHead>
                  <TableHead className="text-center">Cst/PCS</TableHead>
                  <TableHead className="text-right">Consum</TableHead>
                  <TableHead className="text-right">Preț/Unit</TableHead>
                  <TableHead className="text-right">Net (lei)</TableHead>
                  <TableHead className="text-right">TVA (lei)</TableHead>
                  <TableHead className="text-right font-bold">Total (lei)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {space.utilities.map((u, idx) => u && (
                  <TableRow key={idx} className="text-sm">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${getUtilityColor(u.utilityType)}`}>
                          {u.utilityName}
                        </Badge>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          ({getMethodLabel(u.distributionMethod)})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {u.hasMeter && u.indexOld !== undefined ? u.indexOld.toLocaleString('ro-RO') : '-'}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {u.hasMeter && u.indexNew !== undefined ? u.indexNew.toLocaleString('ro-RO') : '-'}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      {u.constant && u.constant !== 1 ? (
                        <span>×{u.constant}</span>
                      ) : u.pcs ? (
                        <span title="PCS">{u.pcs}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {u.consumption.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {u.unit}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {u.pricePerUnit > 0 ? u.pricePerUnit.toLocaleString('ro-RO', { minimumFractionDigits: 4 }) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.netValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {u.vatValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {u.totalValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ))}

      {/* Summary by Utility */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-primary/10 px-4 py-3">
          <p className="font-semibold text-primary">Sumar pe Utilități</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Utilitate/Serviciu</TableHead>
              <TableHead className="text-right">Consum Total</TableHead>
              <TableHead className="text-right">Valoare Netă</TableHead>
              <TableHead className="text-right">TVA</TableHead>
              <TableHead className="text-right font-bold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grandTotalsByUtility.map((u, idx) => u && (
              <TableRow key={idx}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getUtilityColor(u.id)}>
                      {u.name}
                    </Badge>
                    <span className="text-sm">{u.fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {u.totalConsumption.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} {u.unit}
                </TableCell>
                <TableCell className="text-right">
                  {u.totalNet.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {u.totalVat.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {u.totalValue.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-primary/5 border-t-2 border-primary/20">
              <TableCell colSpan={4} className="text-right font-bold text-lg">
                TOTAL DE PLATĂ:
              </TableCell>
              <TableCell className="text-right font-bold text-xl text-primary">
                {grandTotal.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Footer & Actions */}
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
