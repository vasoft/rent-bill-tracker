import Dexie, { type Table } from 'dexie';
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
  consumption: number;
  netValue: number;
  vatValue: number;
  totalValue: number;
}

class OffGusDatabase extends Dexie {
  meterReadings!: Table<DbMeterReading>;
  distributions!: Table<DbDistribution>;
  currentMonth!: Table<DbCurrentMonth>;

  constructor() {
    super('offgus-db');
    this.version(1).stores({
      meterReadings: '++id, spaceId, utilityType, period, [spaceId+utilityType+period]',
      distributions: '++id, spaceId, clientId, utilityType, period, [clientId+period]',
      currentMonth: '++id, spaceId, clientId, utilityType, period, [spaceId+utilityType+period]',
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
}
