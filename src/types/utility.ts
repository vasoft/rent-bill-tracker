// Types for OFF-GUS Utility Management System

export type UtilityType = 'EE' | 'GN' | 'AC' | 'AA' | 'SM' | 'AS' | 'SSV';

export interface UtilityInfo {
  id: UtilityType;
  name: string;
  fullName: string;
  unit: string;
  color: string;
  hasMeter: boolean;
}

export interface Space {
  id: string;
  name: string;
  area: number; // mp
  persons: number;
  clientId: string | null;
  racordEE: string; // empty = no connection, filled = connection name (e.g. "EET1")
  racordGN: string; // empty = no connection, filled = connection name (e.g. "GNB1")
  racordAA: string; // empty = no connection, filled = connection name (e.g. "AAR1")
}

export interface Client {
  id: string;
  name: string;
  type: 'PJ' | 'PF';
  spaces: string[]; // Space IDs
}

export interface Supplier {
  id: string;
  name: string;
  utilityType: UtilityType;
  contractNumber?: string;
}

export interface MeterReading {
  id: string;
  spaceId: string;
  utilityType: UtilityType;
  period: string; // YYYY-MM format
  indexNew: number;
  indexOld: number;
  constant: number;
  pcs?: number; // For natural gas
  consumption: number;
}

export interface SupplierInvoice {
  id: string;
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
  netValueTaxable: number;  // Valoare netă cu TVA (la cota selectată)
  netValueExempt: number;   // Valoare netă scutită TVA (cotă 0%)
  netValue: number;         // Total net = taxable + exempt
  vatRate: number;
  vatValue: number;
  totalValue: number;
}

export interface ConsumptionDistribution {
  id: string;
  invoiceId: string;
  spaceId: string;
  clientId: string;
  utilityType: UtilityType;
  period: string;
  consumption: number;
  netValue: number;
  vatValue: number;
  totalValue: number;
  distributionMethod: 'meter' | 'area' | 'persons' | 'percentage';
}

export interface ConsumptionNote {
  id: string;
  clientId: string;
  period: string;
  createdAt: string;
  spaces: {
    spaceId: string;
    spaceName: string;
    utilities: {
      utilityType: UtilityType;
      indexNew?: number;
      indexOld?: number;
      consumption: number;
      unit: string;
      price: number;
      netValue: number;
      vatValue: number;
      totalValue: number;
    }[];
  }[];
  grandTotal: number;
}

export interface MonthlyStats {
  period: string;
  byUtility: {
    utilityType: UtilityType;
    consumption: number;
    value: number;
  }[];
  totalValue: number;
}

export const UTILITIES: UtilityInfo[] = [
  { id: 'EE', name: 'EE', fullName: 'Energie Electrică', unit: 'kWh', color: 'chart-ee', hasMeter: true },
  { id: 'GN', name: 'GN', fullName: 'Gaze Naturale', unit: 'Nmc', color: 'chart-gn', hasMeter: true },
  { id: 'AC', name: 'AC', fullName: 'Apă și Canalizare', unit: 'mc', color: 'chart-ac', hasMeter: true },
  { id: 'AA', name: 'AA', fullName: 'Analize Ape Uzate', unit: 'mc', color: 'chart-aa', hasMeter: false },
  { id: 'AS', name: 'AS', fullName: 'Apă din Subteran', unit: 'mc', color: 'chart-as', hasMeter: false },
  { id: 'SM', name: 'SM', fullName: 'Serviciul Mentenanță', unit: 'lei', color: 'chart-sm', hasMeter: false },
  { id: 'SSV', name: 'SSV', fullName: 'Serviciul Supraveghere Video', unit: 'lei', color: 'chart-sm', hasMeter: false },
];

export const getUtilityInfo = (type: UtilityType): UtilityInfo => {
  return UTILITIES.find(u => u.id === type) || UTILITIES[0];
};
