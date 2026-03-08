import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { UTILITIES, UtilityType } from '@/types/utility';

interface UtilityChartProps {
  chartData: Record<string, Record<string, number>>;
  selectedPeriod: string;
}

const UtilityChart = ({ chartData, selectedPeriod }: UtilityChartProps) => {
  // Get up to 6 periods ending with selected period
  const allPeriods = Object.keys(chartData).sort();
  const selectedIdx = allPeriods.indexOf(selectedPeriod);
  const endIdx = selectedIdx >= 0 ? selectedIdx + 1 : allPeriods.length;
  const startIdx = Math.max(0, endIdx - 6);
  const visiblePeriods = allPeriods.slice(startIdx, endIdx);

  const data = visiblePeriods.map(period => {
    const [year, month] = period.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ro-RO', { month: 'short' });
    const result: Record<string, string | number> = {
      name: monthName.charAt(0).toUpperCase() + monthName.slice(1)
    };
    const periodValues = chartData[period] || {};
    Object.entries(periodValues).forEach(([ut, val]) => {
      result[ut] = Math.round(val * 100) / 100;
    });
    return result;
  });

  // Detect which utilities have data
  const activeUtilities = UTILITIES.filter(u =>
    visiblePeriods.some(p => (chartData[p]?.[u.id] || 0) > 0)
  ).map(u => u.id);

  const colors: Record<UtilityType, string> = {
    EE: '#3B82F6', GN: '#F59E0B', AC: '#06B6D4', AA: '#10B981',
    SM: '#8B5CF6', AS: '#14B8A6', SSV: '#EC4899', SC: '#F59E0B',
  };

  return (
    <div className="utility-card h-80">
      <h3 className="font-semibold text-foreground mb-4">Evoluție Costuri Utilități</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            formatter={(value: number) => [`${value.toLocaleString('ro-RO')} lei`, '']}
          />
          <Legend formatter={(value) => UTILITIES.find(u => u.id === value)?.name || value} />
          {activeUtilities.map((utility) => (
            <Bar key={utility} dataKey={utility} fill={colors[utility]} radius={[4, 4, 0, 0]} name={utility} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UtilityChart;
