import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/db';
import { spaces, clients } from '@/data/mockData';
import { type AcSpaceRow } from '@/hooks/use-ac-distribution';

export interface AsSpaceRow {
  spaceId: string;
  spaceName: string;
  clientId: string;
  clientName: string;
  consumReferinta: number;   // Alimentare cu apă from A&C
  cantitateAlocata: number;  // Distributed consumption (mc)
  valoareNeta: number;
  valoareTva: number;
  total: number;
}

export function useAsDistribution(acSpaceData: AcSpaceRow[], currentPeriod: string) {
  const [asInvoice, setAsInvoice] = useState<{
    totalConsumption: number;
    netValue: number;
    vatValue: number;
    totalValue: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const invoices = await db.supplierInvoices
        .where('[utilityType+period]')
        .equals(['AS', currentPeriod])
        .toArray();
      if (invoices.length > 0) {
        setAsInvoice({
          totalConsumption: invoices[0].totalConsumption,
          netValue: invoices[0].netValue,
          vatValue: invoices[0].vatValue,
          totalValue: invoices[0].totalValue,
        });
      } else {
        setAsInvoice(null);
      }
    };
    load();
  }, [currentPeriod]);

  const asData: AsSpaceRow[] = useMemo(() => {
    const occupiedSpaces = spaces.filter(s => s.clientId !== null);

    // Reference = Alimentare cu apă from A&C
    const totalConsumReferinta = acSpaceData.reduce((sum, r) => sum + r.alimentareApa, 0);

    const asTotalConsumption = asInvoice?.totalConsumption || 0;
    const asNetValue = asInvoice?.netValue || 0;
    const asVatValue = asInvoice?.vatValue || 0;

    return occupiedSpaces.map(space => {
      const client = clients.find(c => c.id === space.clientId);
      const acRow = acSpaceData.find(r => r.spaceId === space.id);
      const consumReferinta = acRow?.alimentareApa || 0;

      // cantitate alocata = (consum referinta spatiu / total consum referinta) * consum AS facturat
      const proportion = totalConsumReferinta > 0
        ? consumReferinta / totalConsumReferinta
        : 0;

      const cantitateAlocata = asTotalConsumption * proportion;

      // valoare = (consumAS spatiu / consumAS total) * valoare
      // Since all cantitateAlocata sum to asTotalConsumption, proportion is the same
      const totalCantitate = asTotalConsumption;
      const valueProportion = totalCantitate > 0
        ? cantitateAlocata / totalCantitate
        : 0;

      const valoareNeta = asNetValue * valueProportion;
      const valoareTva = asVatValue * valueProportion;
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
  }, [acSpaceData, asInvoice]);

  return { asData, asInvoice };
}
