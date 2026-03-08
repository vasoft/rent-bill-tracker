import { Building2, Users, Zap, Banknote, Receipt, Coins } from 'lucide-react';

export interface SummaryStatsData {
  spacesCount: number;
  clientsCount: number;
  totalConsumption: string;
  totalNetValue: string;
  totalVat: string;
  totalValue: string;
}

interface SummaryStatsProps {
  data: SummaryStatsData;
  compact?: boolean;
  hideConsumption?: boolean;
}

const stats = [
  { key: 'spacesCount' as const, label: 'Spații', icon: Building2, format: (v: string | number) => String(v) },
  { key: 'clientsCount' as const, label: 'Clienți', icon: Users, format: (v: string | number) => String(v) },
  { key: 'totalConsumption' as const, label: 'Consum Total', icon: Zap, format: (v: string | number) => String(v) },
  { key: 'totalNetValue' as const, label: 'Valoare Netă', icon: Banknote, format: (v: string | number) => `${v} lei` },
  { key: 'totalVat' as const, label: 'TVA', icon: Receipt, format: (v: string | number) => `${v} lei` },
  { key: 'totalValue' as const, label: 'Total', icon: Coins, format: (v: string | number) => `${v} lei` },
];

const SummaryStats = ({ data, compact = false, hideConsumption = false }: SummaryStatsProps) => {
  const filteredStats = hideConsumption ? stats.filter(s => s.key !== 'totalConsumption') : stats;
  
  if (compact) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filteredStats.map(({ key, label, icon: Icon, format }) => (
          <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold truncate">{format(data[key])}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const gridCols = hideConsumption ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';

  return (
    <div className={`grid ${gridCols} gap-3`}>
      {filteredStats.map(({ key, label, icon: Icon, format }) => (
        <div key={key} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <div className="p-2 rounded-md bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-bold truncate">{format(data[key])}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryStats;
