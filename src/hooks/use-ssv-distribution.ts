import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/db';
import { spaces, clients } from '@/data/mockData';
import { type AcSpaceRow } from '@/hooks/use-ac-distribution';

export interface SsvSpaceRow {
  spaceId: string;
  spaceName: string;
  clientId: string;
  clientName: string;
  consumReferinta: number;   // Area (mp) from A&C
  cantitateAlocata: number;  // Distributed consumption (lei)
  valoareNeta: number;
  valoareTva: number;
  total: number;
}

export function useSsvDistribution(acSpaceData: AcSpaceRow[], currentPeriod: string) {
  const [ssvInvoice, setSsvInvoice] = useState<{
    totalConsumption: number;
    netValue: number;
    vatValue: number;
    totalValue: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const invoices = await db.supplierInvoices
        .where('[utilityType+period]')
        .equals(['SSV', currentPeriod])
        .toArray();
      if (invoices.length > 0) {
        setSsvInvoice({
          totalConsumption: invoices[0].totalConsumption,
          netValue: invoices[0].netValue,
          vatValue: invoices[0].vatValue,
          totalValue: invoices[0].totalValue,
        });
      } else {
        setSsvInvoice(null);
      }
    };
    load();
  }, [currentPeriod]);

  const ssvData: SsvSpaceRow[] = useMemo(() => {
    const occupiedSpaces = spaces.filter(s => s.clientId !== null);

    // Reference = area (suprafață) from A&C spaces
    const totalConsumReferinta = acSpaceData.reduce((sum, r) => sum + r.area, 0);

    const ssvTotalConsumption = ssvInvoice?.totalConsumption || 0;
    const ssvNetValue = ssvInvoice?.netValue || 0;
    const ssvVatValue = ssvInvoice?.vatValue || 0;

    return occupiedSpaces.map(space => {
      const client = clients.find(c => c.id === space.clientId);
      const acRow = acSpaceData.find(r => r.spaceId === space.id);
      const consumReferinta = acRow?.area || space.area;

      const proportion = totalConsumReferinta > 0
        ? consumReferinta / totalConsumReferinta
        : 0;

      const cantitateAlocata = ssvTotalConsumption * proportion;
      const valoareNeta = ssvNetValue * proportion;
      const valoareTva = ssvVatValue * proportion;
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
  }, [acSpaceData, ssvInvoice]);

  return { ssvData, ssvInvoice };
}
