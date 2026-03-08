import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { UtilityType, UTILITIES } from '@/types/utility';

interface UtilityBreakdownProps {
  data: {
    utilityType: UtilityType;
    totalValue: number;
  }[];
}

const COLORS: Record<UtilityType, string> = {
  EE: 'hsl(220, 70%, 50%)',
  GN: 'hsl(38, 85%, 55%)',
  AC: 'hsl(195, 85%, 50%)',
  AA: 'hsl(152, 60%, 45%)',
  AS: 'hsl(175, 60%, 45%)',
  SM: 'hsl(280, 60%, 55%)',
  SSV: 'hsl(330, 65%, 55%)',
  SC: 'hsl(30, 75%, 50%)',
};

const UtilityBreakdown = ({ data }: UtilityBreakdownProps) => {
  const chartData = data
    .filter(u => u.totalValue > 0)
    .map(u => ({
      name: UTILITIES.find(ut => ut.id === u.utilityType)?.fullName || u.utilityType,
      shortName: u.utilityType,
      value: Math.round(u.totalValue * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="utility-card h-80">
      <h3 className="font-semibold text-foreground mb-4">Repartizare pe Utilități</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.shortName as UtilityType]} stroke="hsl(var(--background))" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            formatter={(value: number) => [`${value.toLocaleString('ro-RO')} lei`, '']}
          />
          <Legend
            layout="vertical" align="right" verticalAlign="middle"
            formatter={(value, entry: any) => <span className="text-sm text-foreground">{entry.payload.shortName}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UtilityBreakdown;
