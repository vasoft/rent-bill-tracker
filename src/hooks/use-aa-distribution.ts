import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/db';
import { spaces, clients } from '@/data/mockData';
import { type AcSpaceRow } from '@/hooks/use-ac-distribution';

export interface AaSpaceRow {
  spaceId: string;
  spaceName: string;
  clientId: string;
  clientName: string;
  consumReferinta: number;   // Consum total from A&C
  cantitateAlocata: number;  // Distributed quantity of AA analyses
  valoareNeta: number;
  valoareTva: number;
  total: number;
}

export function useAaDistribution(acSpaceData: AcSpaceRow[], currentPeriod: string) {
  const [aaInvoice, setAaInvoice] = useState<{
    totalConsumption: number;
    netValue: number;
    vatValue: number;
    totalValue: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const invoices = await db.supplierInvoices
        .where('[utilityType+period]')
        .equals(['AA', currentPeriod])
        .toArray();
      if (invoices.length > 0) {
        setAaInvoice({
          totalConsumption: invoices[0].totalConsumption,
          netValue: invoices[0].netValue,
          vatValue: invoices[0].vatValue,
          totalValue: invoices[0].totalValue,
        });
      } else {
        setAaInvoice(null);
      }
    };
    load();
  }, [currentPeriod]);

  const aaData: AaSpaceRow[] = useMemo(() => {
    const occupiedSpaces = spaces.filter(s => s.clientId !== null);

    // Total consum referință (from A&C consumTotal across all spaces)
    const totalConsumReferinta = acSpaceData.reduce((sum, r) => sum + r.consumTotal, 0);

    const aaTotalQuantity = aaInvoice?.totalConsumption || 0;
    const aaNetValue = aaInvoice?.netValue || 0;
    const aaVatValue = aaInvoice?.vatValue || 0;

    return occupiedSpaces.map(space => {
      const client = clients.find(c => c.id === space.clientId);
      const acRow = acSpaceData.find(r => r.spaceId === space.id);
      const consumReferinta = acRow?.consumTotal || 0;

      // cantitate alocata = (consum referinta spatiu / total consum referinta) * cantitate AA
      const cantitateAlocata = totalConsumReferinta > 0
        ? (consumReferinta / totalConsumReferinta) * aaTotalQuantity
        : 0;

      // valoare neta = (cantitate spatiu / cantitate totala) * valoare neta facturata
      // Since cantitate totala = sum of all cantitate alocate = aaTotalQuantity (by construction),
      // we can use the same proportion
      const proportion = totalConsumReferinta > 0
        ? consumReferinta / totalConsumReferinta
        : 0;

      const valoareNeta = aaNetValue * proportion;
      const valoareTva = aaVatValue * proportion;
      const total = valoareNeta + valoareTva;

      return {
        spaceId: space.id,
        spaceName: space.name,
        clientId: client?.id || '',
        clientName: client?.name || 'Necunoscut',
        consumReferinta,
        cantitateAlocata,
        valoareNeta,
        valoareTva,
        total,
      };
    });
  }, [acSpaceData, aaInvoice]);

  return { aaData, aaInvoice };
}
