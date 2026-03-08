import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/db';
import { spaces, clients } from '@/data/mockData';
import { AcSubLine } from '@/types/utility';
import { type CurrentMonthRow } from '@/hooks/use-utilities-db';

export interface AcSpaceRow {
  spaceId: string;
  spaceName: string;
  area: number;
  clientId: string;
  clientName: string;
  persons: number;
  hasMeter: boolean;
  alimentareApa: number;
  canalizare: number;
  apeMeteorie: number;
  taxa: number;
  consumTotal: number;
  currentMonthRow?: CurrentMonthRow;
}

export interface AcValueRow extends AcSpaceRow {
  aaNet: number; cnNet: number; amNet: number; txNet: number;
  aaVat: number; cnVat: number; amVat: number; txVat: number;
  valoareNeta: number;
  valoareTva: number;
  valoareTotala: number;
}

export function useAcDistribution(currentMonthData: CurrentMonthRow[], currentPeriod: string) {
  const [acSubLines, setAcSubLines] = useState<AcSubLine[]>([]);

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

  const acSpaceData: AcSpaceRow[] = useMemo(() => {
    const occupiedSpaces = spaces.filter(s => s.clientId !== null);

    const aaInvoice = acSubLines.find(l => l.code === 'AC-AA');
    const amInvoice = acSubLines.find(l => l.code === 'AC-AM');

    const invoicedAaConsumption = aaInvoice?.consumption || 0;
    const invoicedAmConsumption = amInvoice?.consumption || 0;

    const spaceRows = occupiedSpaces.map(space => {
      const client = clients.find(c => c.id === space.clientId);
      const acRow = acRows.find(r => r.spaceId === space.id);

      return {
        space,
        client,
        acRow,
      };
    });

    const totalPersonsAll = spaceRows.reduce((sum, r) => sum + r.space.persons, 0);
    const aaCsp = totalPersonsAll > 0 ? invoicedAaConsumption / totalPersonsAll : 0;

    const totalArea = spaceRows.reduce((sum, r) => sum + r.space.area, 0);
    const amCsp = totalArea > 0 ? invoicedAmConsumption / totalArea : 0;

    return spaceRows.map(r => {
      const alimentareApa = r.space.persons * aaCsp;
      const canalizare = alimentareApa;
      const apeMeteorie = r.space.area * amCsp;
      const taxa = canalizare + apeMeteorie;
      const consumTotal = canalizare + apeMeteorie;

      return {
        spaceId: r.space.id,
        spaceName: r.space.name,
        area: r.space.area,
        clientId: r.client?.id || '',
        clientName: r.client?.name || 'Necunoscut',
        persons: r.space.persons,
        hasMeter: false,
        alimentareApa,
        canalizare,
        apeMeteorie,
        taxa,
        consumTotal,
        currentMonthRow: r.acRow,
      };
    });
  }, [acRows, acSubLines]);

  const computeAcValueData = useMemo((): AcValueRow[] => {
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
  }, [acSpaceData, acSubLines]);

  return { acSubLines, acSpaceData, acValueData: computeAcValueData };
}
