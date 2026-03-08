import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/db';
import { spaces, clients } from '@/data/mockData';
import { type AcValueRow } from '@/hooks/use-ac-distribution';
import { type CurrentMonthRow } from '@/hooks/use-utilities-db';

export interface SmSpaceRow {
  spaceId: string;
  spaceName: string;
  clientId: string;
  clientName: string;
  consumReferinta: number;   // EE netValue + A&C netValue for this space
  cantitateAlocata: number;  // Distributed SM consumption (lei)
  valoareNeta: number;
  valoareTva: number;
  total: number;
}

export function useSmDistribution(
  acValueData: AcValueRow[],
  currentMonthData: CurrentMonthRow[],
  currentPeriod: string
) {
  const [smInvoice, setSmInvoice] = useState<{
    totalConsumption: number;
    netValue: number;
    vatValue: number;
    totalValue: number;
  } | null>(null);

  // EE value data per space (needs supplier invoice)
  const [eeValueData, setEeValueData] = useState<{ spaceId: string; netValue: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      // Load SM invoice
      const smInvoices = await db.supplierInvoices
        .where('[utilityType+period]')
        .equals(['SM', currentPeriod])
        .toArray();
      setSmInvoice(smInvoices.length > 0 ? {
        totalConsumption: smInvoices[0].totalConsumption,
        netValue: smInvoices[0].netValue,
        vatValue: smInvoices[0].vatValue,
        totalValue: smInvoices[0].totalValue,
      } : null);

      // Load EE invoice to compute EE net value per space
      const eeInvoices = await db.supplierInvoices
        .where('[utilityType+period]')
        .equals(['EE', currentPeriod])
        .toArray();
      const eeInvoice = eeInvoices.length > 0 ? eeInvoices[0] : null;

      // Get EE rows from currentMonthData
      const eeRows = currentMonthData.filter(r => r.utilityType === 'EE');
      const totalEeConsumption = eeRows.reduce((sum, r) => sum + r.consumption, 0);

      const eePerSpace = eeRows.map(r => ({
        spaceId: r.spaceId,
        netValue: eeInvoice && totalEeConsumption > 0
          ? (r.consumption / totalEeConsumption) * eeInvoice.netValue
          : 0,
      }));
      setEeValueData(eePerSpace);
    };
    load();
  }, [currentPeriod, currentMonthData]);

  const smData: SmSpaceRow[] = useMemo(() => {
    const occupiedSpaces = spaces.filter(s => s.clientId !== null);

    const smTotalConsumption = smInvoice?.totalConsumption || 0;
    const smNetValue = smInvoice?.netValue || 0;
    const smVatValue = smInvoice?.vatValue || 0;

    // Build reference consumption per space: EE net + A&C net
    const spaceRefs = occupiedSpaces.map(space => {
      const eeVal = eeValueData.find(e => e.spaceId === space.id)?.netValue || 0;
      const acVal = acValueData.find(r => r.spaceId === space.id)?.valoareNeta || 0;
      return { space, consumReferinta: eeVal + acVal };
    });

    const totalConsumReferinta = spaceRefs.reduce((sum, r) => sum + r.consumReferinta, 0);

    return spaceRefs.map(({ space, consumReferinta }) => {
      const client = clients.find(c => c.id === space.clientId);
      const proportion = totalConsumReferinta > 0 ? consumReferinta / totalConsumReferinta : 0;
      const cantitateAlocata = smTotalConsumption * proportion;
      const valoareNeta = smNetValue * proportion;
      const valoareTva = smVatValue * proportion;

      return {
        spaceId: space.id,
        spaceName: space.name,
        clientId: client?.id || '',
        clientName: client?.name || 'Necunoscut',
        consumReferinta,
        cantitateAlocata,
        valoareNeta,
        valoareTva,
        total: valoareNeta + valoareTva,
      };
    });
  }, [acValueData, eeValueData, smInvoice]);

  return { smData, smInvoice };
}
