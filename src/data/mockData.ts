import { Space, Client, Supplier, MeterReading, SupplierInvoice, ConsumptionDistribution, MonthlyStats } from '@/types/utility';

export const spaces: Space[] = [
  { id: 'P1', name: 'Parter-NordEst1', area: 185, persons: 1, clientId: 'CL1' },
  { id: 'P2', name: 'Parter-NordEst2', area: 25, persons: 1, clientId: 'CL1' },
  { id: 'P3', name: 'Parter-SudEst', area: 450, persons: 1, clientId: 'CL2' },
  { id: 'P4', name: 'Parter-Sud', area: 79, persons: 1, clientId: 'CL3' },
  { id: 'P5', name: 'Parter-SudVest', area: 790, persons: 10, clientId: 'CL4' },
  { id: 'P6', name: 'Parter-Vest', area: 240, persons: 2, clientId: 'CL5' },
  { id: 'P7', name: 'Parter-NordVest1', area: 40, persons: 1, clientId: 'CL6' },
  { id: 'P8', name: 'Parter-NordVest2', area: 420, persons: 3, clientId: 'CL6' },
  { id: 'E1', name: 'Etaj-CentralEst', area: 150, persons: 1, clientId: 'CL7' },
  { id: 'E2', name: 'Etaj-NordVest1', area: 100, persons: 0, clientId: null },
  { id: 'E3', name: 'Etaj-NordVest2', area: 21, persons: 1, clientId: 'CL8' },
];

export const clients: Client[] = [
  { id: 'CL1', name: 'CLIENT 1', type: 'PJ', spaces: ['P1', 'P2'] },
  { id: 'CL2', name: 'CLIENT 2', type: 'PJ', spaces: ['P3'] },
  { id: 'CL3', name: 'CLIENT 3', type: 'PF', spaces: ['P4'] },
  { id: 'CL4', name: 'CLIENT 4', type: 'PJ', spaces: ['P5'] },
  { id: 'CL5', name: 'CLIENT 5', type: 'PJ', spaces: ['P6'] },
  { id: 'CL6', name: 'CLIENT 6', type: 'PJ', spaces: ['P7', 'P8'] },
  { id: 'CL7', name: 'CLIENT 7', type: 'PF', spaces: ['E1'] },
  { id: 'CL8', name: 'CLIENT 8', type: 'PF', spaces: ['E3'] },
];

export const suppliers: Supplier[] = [
  { id: 'FR1', name: 'FURNIZOR 1', utilityType: 'EE', contractNumber: 'EE-2024-001' },
  { id: 'FR2', name: 'FURNIZOR 2', utilityType: 'AC', contractNumber: 'AC-2024-001' },
  { id: 'FR3', name: 'FURNIZOR 3', utilityType: 'GN', contractNumber: 'GN-2024-001' },
  { id: 'FR4', name: 'FURNIZOR 4', utilityType: 'AA', contractNumber: 'AA-2024-001' },
  { id: 'FR5', name: 'FURNIZOR 5', utilityType: 'AS', contractNumber: 'AS-2024-001' },
  { id: 'FR6', name: 'FURNIZOR 6', utilityType: 'SSV', contractNumber: 'SSV-2024-001' },
  { id: 'FR7', name: 'FURNIZOR 7', utilityType: 'SM', contractNumber: 'SM-2024-001' },
];

export const meterReadings: MeterReading[] = [
  { id: 'MR1', spaceId: 'P1', utilityType: 'EE', period: '2025-12', indexNew: 74, indexOld: 56, constant: 20, consumption: 360 },
  { id: 'MR2', spaceId: 'P2', utilityType: 'EE', period: '2025-12', indexNew: 452, indexOld: 411, constant: 1, consumption: 41 },
  { id: 'MR3', spaceId: 'P3', utilityType: 'EE', period: '2025-12', indexNew: 389, indexOld: 287, constant: 1, consumption: 102 },
  { id: 'MR4', spaceId: 'P4', utilityType: 'EE', period: '2025-12', indexNew: 722, indexOld: 653, constant: 1, consumption: 69 },
  { id: 'MR5', spaceId: 'P5', utilityType: 'EE', period: '2025-12', indexNew: 711, indexOld: 699, constant: 20, consumption: 240 },
  { id: 'MR6', spaceId: 'P6', utilityType: 'EE', period: '2025-12', indexNew: 487, indexOld: 463, constant: 30, consumption: 720 },
  { id: 'MR7', spaceId: 'P7', utilityType: 'EE', period: '2025-12', indexNew: 597, indexOld: 582, constant: 30, consumption: 450 },
  { id: 'MR8', spaceId: 'P8', utilityType: 'EE', period: '2025-12', indexNew: 483, indexOld: 471, constant: 20, consumption: 240 },
  { id: 'MR9', spaceId: 'E1', utilityType: 'EE', period: '2025-12', indexNew: 357, indexOld: 345, constant: 20, consumption: 240 },
  { id: 'MR10', spaceId: 'E2', utilityType: 'EE', period: '2025-12', indexNew: 35, indexOld: 35, constant: 20, consumption: 0 },
  { id: 'MR11', spaceId: 'E3', utilityType: 'EE', period: '2025-12', indexNew: 321, indexOld: 288, constant: 20, consumption: 660 },
  // GN readings
  { id: 'MR12', spaceId: 'P1', utilityType: 'GN', period: '2025-12', indexNew: 37084, indexOld: 37070, constant: 1, pcs: 10.940, consumption: 153.16 },
  { id: 'MR13', spaceId: 'P5', utilityType: 'GN', period: '2025-12', indexNew: 16685, indexOld: 16635, constant: 1, pcs: 10.940, consumption: 547 },
  { id: 'MR14', spaceId: 'P8', utilityType: 'GN', period: '2025-12', indexNew: 14169, indexOld: 14165, constant: 1, pcs: 10.940, consumption: 43.76 },
];

export const supplierInvoices: SupplierInvoice[] = [
  {
    id: 'INV1',
    supplierId: 'FR1',
    utilityType: 'EE',
    period: '2025-12',
    invoiceNumber: 'FE-2025-1234',
    issueDate: '2025-12-31',
    indexNew: 2514,
    indexOld: 2167,
    constant: 10,
    totalConsumption: 3470,
    netValue: 3800,
    vatRate: 21,
    vatValue: 798,
    totalValue: 4598
  },
  {
    id: 'INV2',
    supplierId: 'FR2',
    utilityType: 'AC',
    period: '2025-12',
    invoiceNumber: 'FAC-2025-5678',
    issueDate: '2025-12-31',
    totalConsumption: 160.11,
    netValue: 587.60,
    vatRate: 11,
    vatValue: 63.40,
    totalValue: 651.01
  },
  {
    id: 'INV3',
    supplierId: 'FR3',
    utilityType: 'GN',
    period: '2025-12',
    invoiceNumber: 'FGN-2025-9012',
    issueDate: '2025-12-31',
    indexNew: 358,
    indexOld: 287,
    pcs: 10.940,
    totalConsumption: 776.74,
    netValue: 231.08,
    vatRate: 21,
    vatValue: 48.53,
    totalValue: 279.61
  },
  {
    id: 'INV4',
    supplierId: 'FR4',
    utilityType: 'AA',
    period: '2025-12',
    invoiceNumber: 'FAA-2025-3456',
    issueDate: '2025-12-31',
    totalConsumption: 160.11,
    netValue: 545,
    vatRate: 21,
    vatValue: 114.45,
    totalValue: 659.45
  },
  {
    id: 'INV5',
    supplierId: 'FR5',
    utilityType: 'AS',
    period: '2025-12',
    invoiceNumber: 'FAS-2025-7890',
    issueDate: '2025-12-31',
    totalConsumption: 250,
    netValue: 610,
    vatRate: 11,
    vatValue: 67.10,
    totalValue: 677.10
  },
  {
    id: 'INV6',
    supplierId: 'FR6',
    utilityType: 'SSV',
    period: '2025-12',
    invoiceNumber: 'FSSV-2025-1111',
    issueDate: '2025-12-31',
    totalConsumption: 0,
    netValue: 65,
    vatRate: 21,
    vatValue: 13.65,
    totalValue: 78.65
  },
  {
    id: 'INV7',
    supplierId: 'FR7',
    utilityType: 'SM',
    period: '2025-12',
    invoiceNumber: 'FSM-2025-2222',
    issueDate: '2025-12-31',
    totalConsumption: 0,
    netValue: 647,
    vatRate: 21,
    vatValue: 135.87,
    totalValue: 782.87
  },
];

export const consumptionDistributions: ConsumptionDistribution[] = [
  // EE distributions
  { id: 'CD1', invoiceId: 'INV1', spaceId: 'P1', clientId: 'CL1', utilityType: 'EE', period: '2025-12', consumption: 360, netValue: 438.18, vatValue: 92.02, totalValue: 530.20, distributionMethod: 'meter' },
  { id: 'CD2', invoiceId: 'INV1', spaceId: 'P2', clientId: 'CL1', utilityType: 'EE', period: '2025-12', consumption: 41, netValue: 49.90, vatValue: 10.48, totalValue: 60.38, distributionMethod: 'meter' },
  { id: 'CD3', invoiceId: 'INV1', spaceId: 'P3', clientId: 'CL2', utilityType: 'EE', period: '2025-12', consumption: 102, netValue: 124.15, vatValue: 26.07, totalValue: 150.22, distributionMethod: 'meter' },
  { id: 'CD4', invoiceId: 'INV1', spaceId: 'P4', clientId: 'CL3', utilityType: 'EE', period: '2025-12', consumption: 69, netValue: 83.98, vatValue: 17.64, totalValue: 101.62, distributionMethod: 'meter' },
  { id: 'CD5', invoiceId: 'INV1', spaceId: 'P5', clientId: 'CL4', utilityType: 'EE', period: '2025-12', consumption: 240, netValue: 292.12, vatValue: 61.35, totalValue: 353.47, distributionMethod: 'meter' },
  { id: 'CD6', invoiceId: 'INV1', spaceId: 'P6', clientId: 'CL5', utilityType: 'EE', period: '2025-12', consumption: 720, netValue: 876.36, vatValue: 184.04, totalValue: 1060.40, distributionMethod: 'meter' },
  { id: 'CD7', invoiceId: 'INV1', spaceId: 'P7', clientId: 'CL6', utilityType: 'EE', period: '2025-12', consumption: 450, netValue: 547.73, vatValue: 115.02, totalValue: 662.75, distributionMethod: 'meter' },
  { id: 'CD8', invoiceId: 'INV1', spaceId: 'P8', clientId: 'CL6', utilityType: 'EE', period: '2025-12', consumption: 240, netValue: 292.12, vatValue: 61.35, totalValue: 353.47, distributionMethod: 'meter' },
  { id: 'CD9', invoiceId: 'INV1', spaceId: 'E1', clientId: 'CL7', utilityType: 'EE', period: '2025-12', consumption: 240, netValue: 292.12, vatValue: 61.35, totalValue: 353.47, distributionMethod: 'meter' },
  { id: 'CD10', invoiceId: 'INV1', spaceId: 'E3', clientId: 'CL8', utilityType: 'EE', period: '2025-12', consumption: 660, netValue: 803.33, vatValue: 168.70, totalValue: 972.03, distributionMethod: 'meter' },
  // AC distributions
  { id: 'CD11', invoiceId: 'INV2', spaceId: 'P1', clientId: 'CL1', utilityType: 'AC', period: '2025-12', consumption: 8.54, netValue: 31.33, vatValue: 3.38, totalValue: 34.71, distributionMethod: 'persons' },
  { id: 'CD12', invoiceId: 'INV2', spaceId: 'P2', clientId: 'CL1', utilityType: 'AC', period: '2025-12', consumption: 5.71, netValue: 20.97, vatValue: 2.26, totalValue: 23.23, distributionMethod: 'persons' },
  { id: 'CD13', invoiceId: 'INV2', spaceId: 'P3', clientId: 'CL2', utilityType: 'AC', period: '2025-12', consumption: 13.21, netValue: 48.49, vatValue: 5.23, totalValue: 53.72, distributionMethod: 'persons' },
  { id: 'CD14', invoiceId: 'INV2', spaceId: 'P4', clientId: 'CL3', utilityType: 'AC', period: '2025-12', consumption: 6.67, netValue: 24.47, vatValue: 2.64, totalValue: 27.11, distributionMethod: 'persons' },
  { id: 'CD15', invoiceId: 'INV2', spaceId: 'P5', clientId: 'CL4', utilityType: 'AC', period: '2025-12', consumption: 66.67, netValue: 244.66, vatValue: 26.40, totalValue: 271.06, distributionMethod: 'persons' },
  { id: 'CD16', invoiceId: 'INV2', spaceId: 'P6', clientId: 'CL5', utilityType: 'AC', period: '2025-12', consumption: 14.78, netValue: 54.24, vatValue: 5.85, totalValue: 60.10, distributionMethod: 'persons' },
  { id: 'CD17', invoiceId: 'INV2', spaceId: 'P7', clientId: 'CL6', utilityType: 'AC', period: '2025-12', consumption: 5.98, netValue: 21.94, vatValue: 2.37, totalValue: 24.31, distributionMethod: 'persons' },
  { id: 'CD18', invoiceId: 'INV2', spaceId: 'P8', clientId: 'CL6', utilityType: 'AC', period: '2025-12', consumption: 23.23, netValue: 85.25, vatValue: 9.20, totalValue: 94.45, distributionMethod: 'persons' },
  { id: 'CD19', invoiceId: 'INV2', spaceId: 'E1', clientId: 'CL7', utilityType: 'AC', period: '2025-12', consumption: 7.92, netValue: 29.06, vatValue: 3.14, totalValue: 32.20, distributionMethod: 'persons' },
  { id: 'CD20', invoiceId: 'INV2', spaceId: 'E3', clientId: 'CL8', utilityType: 'AC', period: '2025-12', consumption: 5.64, netValue: 20.71, vatValue: 2.23, totalValue: 22.95, distributionMethod: 'persons' },
];

export const monthlyStats: MonthlyStats[] = [
  {
    period: '2025-12',
    byUtility: [
      { utilityType: 'EE', consumption: 3122, value: 4598 },
      { utilityType: 'GN', consumption: 743.92, value: 279.61 },
      { utilityType: 'AC', consumption: 160.11, value: 651.01 },
      { utilityType: 'AA', consumption: 160.11, value: 659.45 },
      { utilityType: 'AS', consumption: 250, value: 677.10 },
      { utilityType: 'SM', consumption: 0, value: 782.87 },
      { utilityType: 'SSV', consumption: 0, value: 78.65 },
    ],
    totalValue: 7726.69
  },
  {
    period: '2025-11',
    byUtility: [
      { utilityType: 'EE', consumption: 2890, value: 4250 },
      { utilityType: 'GN', consumption: 520, value: 195 },
      { utilityType: 'AC', consumption: 145, value: 590 },
      { utilityType: 'AA', consumption: 145, value: 595 },
      { utilityType: 'AS', consumption: 230, value: 620 },
      { utilityType: 'SM', consumption: 0, value: 750 },
      { utilityType: 'SSV', consumption: 0, value: 78.65 },
    ],
    totalValue: 7078.65
  },
  {
    period: '2025-10',
    byUtility: [
      { utilityType: 'EE', consumption: 2750, value: 4050 },
      { utilityType: 'GN', consumption: 320, value: 120 },
      { utilityType: 'AC', consumption: 155, value: 630 },
      { utilityType: 'AA', consumption: 155, value: 635 },
      { utilityType: 'AS', consumption: 245, value: 660 },
      { utilityType: 'SM', consumption: 0, value: 720 },
      { utilityType: 'SSV', consumption: 0, value: 78.65 },
    ],
    totalValue: 6893.65
  },
  {
    period: '2025-09',
    byUtility: [
      { utilityType: 'EE', consumption: 2980, value: 4380 },
      { utilityType: 'GN', consumption: 180, value: 68 },
      { utilityType: 'AC', consumption: 168, value: 685 },
      { utilityType: 'AA', consumption: 168, value: 690 },
      { utilityType: 'AS', consumption: 265, value: 715 },
      { utilityType: 'SM', consumption: 0, value: 730 },
      { utilityType: 'SSV', consumption: 0, value: 78.65 },
    ],
    totalValue: 7346.65
  },
  {
    period: '2025-08',
    byUtility: [
      { utilityType: 'EE', consumption: 3250, value: 4780 },
      { utilityType: 'GN', consumption: 95, value: 36 },
      { utilityType: 'AC', consumption: 175, value: 712 },
      { utilityType: 'AA', consumption: 175, value: 718 },
      { utilityType: 'AS', consumption: 275, value: 742 },
      { utilityType: 'SM', consumption: 0, value: 745 },
      { utilityType: 'SSV', consumption: 0, value: 78.65 },
    ],
    totalValue: 7811.65
  },
  {
    period: '2025-07',
    byUtility: [
      { utilityType: 'EE', consumption: 3480, value: 5120 },
      { utilityType: 'GN', consumption: 50, value: 19 },
      { utilityType: 'AC', consumption: 182, value: 740 },
      { utilityType: 'AA', consumption: 182, value: 746 },
      { utilityType: 'AS', consumption: 285, value: 768 },
      { utilityType: 'SM', consumption: 0, value: 755 },
      { utilityType: 'SSV', consumption: 0, value: 78.65 },
    ],
    totalValue: 8226.65
  },
];

// Helper function to get client total by period
export const getClientTotalByPeriod = (clientId: string, period: string): number => {
  return consumptionDistributions
    .filter(cd => cd.clientId === clientId && cd.period === period)
    .reduce((sum, cd) => sum + cd.totalValue, 0);
};

// Helper function to get utility total by period
export const getUtilityTotalByPeriod = (utilityType: string, period: string): { consumption: number; value: number } => {
  const distributions = consumptionDistributions.filter(
    cd => cd.utilityType === utilityType && cd.period === period
  );
  return {
    consumption: distributions.reduce((sum, cd) => sum + cd.consumption, 0),
    value: distributions.reduce((sum, cd) => sum + cd.totalValue, 0)
  };
};
