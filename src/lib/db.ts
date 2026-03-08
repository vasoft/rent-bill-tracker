import Dexie, { type Table } from 'dexie/dist/dexie.mjs';
import { type UtilityType } from '@/types/utility';

// Database record types
export interface DbMeterReading {
  id?: number;
  spaceId: string;
  utilityType: UtilityType;
  period: string; // YYYY-MM
  indexOld: number;
  indexNew: number;
  constant: number;
  pcs?: number;
  consumption: number;
}

export interface DbDistribution {
  id?: number;
  spaceId: string;
  clientId: string;
  utilityType: UtilityType;
  period: string;
  consumption: number;
  netValue: number;
  vatValue: number;
  totalValue: number;
  distributionMethod: string;
}

export interface DbCurrentMonth {
  id?: number;
  spaceId: string;
  clientId: string;
  utilityType: UtilityType;
  period: string;
  indexOld: number;
  indexNew: number;
  constant: number;
  isp: number;    // Identificator Specific (nr persoane, suprafață, etc.)
  csp: number;    // Consum Specific (tarif/rată)
  consumption: number;
  netValue: number;
  vatValue: number;
  totalValue: number;
}

export interface DbSupplierInvoice {
  id?: number;
  externalId: string;
  supplierId: string;
  utilityType: UtilityType;
  period: string;
  invoiceNumber: string;
  issueDate: string;
  indexNew?: number;
  indexOld?: number;
  constant?: number;
  pcs?: number;
  totalConsumption: number;
  netValueTaxable: number;
  netValueExempt: number;
  netValue: number;
  vatRate: number;
  vatValue: number;
  totalValue: number;
  acSubLinesJson?: string; // JSON serialized AcSubLine[]
}

export interface DbConfirmedUtility {
  id?: number;
  period: string;
  utilityType: UtilityType;
}

class OffGusDatabase extends Dexie {
  meterReadings!: Table<DbMeterReading>;
  distributions!: Table<DbDistribution>;
  currentMonth!: Table<DbCurrentMonth>;
  supplierInvoices!: Table<DbSupplierInvoice>;
  confirmedUtilities!: Table<DbConfirmedUtility>;

  constructor() {
    super('offgus-db');
    this.version(4).stores({
      meterReadings: '++id, spaceId, utilityType, period, [spaceId+utilityType+period]',
      distributions: '++id, spaceId, clientId, utilityType, period, [clientId+period]',
      currentMonth: '++id, spaceId, clientId, utilityType, period, [spaceId+utilityType+period]',
      supplierInvoices: '++id, externalId, supplierId, utilityType, period, [utilityType+period]',
      confirmedUtilities: '++id, period, utilityType, [period+utilityType]',
    });
  }
}

export const db = new OffGusDatabase();

// Seed historical data from mock on first run
export async function seedIfEmpty() {
  const count = await db.meterReadings.count();
  if (count > 0) return;

  const { meterReadings, consumptionDistributions } = await import('@/data/mockData');

  await db.meterReadings.bulkAdd(
    meterReadings.map(r => ({
      spaceId: r.spaceId,
      utilityType: r.utilityType,
      period: r.period,
      indexOld: r.indexOld,
      indexNew: r.indexNew,
      constant: r.constant,
      pcs: r.pcs,
      consumption: r.consumption,
    }))
  );

  await db.distributions.bulkAdd(
    consumptionDistributions.map(d => ({
      spaceId: d.spaceId,
      clientId: d.clientId,
      utilityType: d.utilityType,
      period: d.period,
      consumption: d.consumption,
      netValue: d.netValue,
      vatValue: d.vatValue,
      totalValue: d.totalValue,
      distributionMethod: d.distributionMethod,
    }))
  );

  const { supplierInvoices: mockInvoices } = await import('@/data/mockData');
  await db.supplierInvoices.bulkAdd(
    mockInvoices.map(inv => ({
      externalId: inv.id,
      supplierId: inv.supplierId,
      utilityType: inv.utilityType,
      period: inv.period,
      invoiceNumber: inv.invoiceNumber,
      issueDate: inv.issueDate,
      indexNew: inv.indexNew,
      indexOld: inv.indexOld,
      constant: inv.constant,
      pcs: inv.pcs,
      totalConsumption: inv.totalConsumption,
      netValueTaxable: inv.netValueTaxable ?? inv.netValue,
      netValueExempt: inv.netValueExempt ?? 0,
      netValue: inv.netValue,
      vatRate: inv.vatRate,
      vatValue: inv.vatValue,
      totalValue: inv.totalValue,
    }))
  );
}
