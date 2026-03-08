import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/db';
import { spaces, clients } from '@/data/mockData';
import { type AcSpaceRow } from '@/hooks/use-ac-distribution';

export interface ScSpaceRow {
  spaceId: string;
  spaceName: string;
  clientId: string;
  clientName: string;
  consumReferinta: number;   // Persons from A&C
  cantitateAlocata: number;  // Distributed consumption (buc)
  valoareNeta: number;
  valoareTva: number;
  total: number;
}

export function useScDistribution(acSpaceData: AcSpaceRow[], currentPeriod: string) {
  const [scInvoice, setScInvoice] = useState<{
    totalConsumption: number;
    netValue: number;
    vatValue: number;
    totalValue: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const invoices = await db.supplierInvoices
        .where('[utilityType+period]')
        .equals(['SC', currentPeriod])
        .toArray();
      if (invoices.length > 0) {
        setScInvoice({
          totalConsumption: invoices[0].totalConsumption,
          netValue: invoices[0].netValue,
          vatValue: invoices[0].vatValue,
          totalValue: invoices[0].totalValue,
        });
      } else {
        setScInvoice(null);
      }
    };
    load();
  }, [currentPeriod]);

  const scData: ScSpaceRow[] = useMemo(() => {
    const occupiedSpaces = spaces.filter(s => s.clientId !== null);

    // Reference = persons from A&C spaces
    const totalConsumReferinta = acSpaceData.reduce((sum, r) => sum + r.persons, 0);

    const scTotalConsumption = scInvoice?.totalConsumption || 0;
    const scNetValue = scInvoice?.netValue || 0;
    const scVatValue = scInvoice?.vatValue || 0;

    return occupiedSpaces.map(space => {
      const client = clients.find(c => c.id === space.clientId);
      const acRow = acSpaceData.find(r => r.spaceId === space.id);
      const consumReferinta = acRow?.persons || space.persons;

      const proportion = totalConsumReferinta > 0
        ? consumReferinta / totalConsumReferinta
        : 0;

      const cantitateAlocata = scTotalConsumption * proportion;
      const valoareNeta = scNetValue * proportion;
      const valoareTva = scVatValue * proportion;
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
  }, [acSpaceData, scInvoice]);

  return { scData, scInvoice };
}
