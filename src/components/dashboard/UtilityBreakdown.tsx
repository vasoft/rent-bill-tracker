import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { UtilityType, UTILITIES } from '@/types/utility';

interface UtilityBreakdownProps {
  data: {
    utilityType: UtilityType;
    totalValue: number;
  }[];
}

const UtilityBreakdown = ({ data }: UtilityBreakdownProps) => {
  const chartData = data
    .filter(u => u.totalValue > 0)
    .map(u => ({
      name: UTILITIES.find(ut => ut.id === u.utilityType)?.fullName || u.utilityType,
      shortName: u.utilityType,
      value: Math.round(u.totalValue * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);

  const colors: Record<UtilityType, string> = {
    EE: '#3B82F6', GN: '#F59E0B', AC: '#06B6D4', AA: '#10B981',
    SM: '#8B5CF6', AS: '#14B8A6', SSV: '#EC4899', SC: '#F59E0B',
  };

  return (
    <div className="utility-card h-80">
      <h3 className="font-semibold text-foreground mb-4">Repartizare pe Utilități</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[entry.shortName as UtilityType]} stroke="hsl(var(--background))" strokeWidth={2} />
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
