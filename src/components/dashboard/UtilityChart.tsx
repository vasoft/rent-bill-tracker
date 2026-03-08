import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { UTILITIES, UtilityType } from '@/types/utility';

interface UtilityChartProps {
  chartData: Record<string, Record<string, number>>;
  selectedPeriod: string;
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

const UtilityChart = ({ chartData, selectedPeriod }: UtilityChartProps) => {
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

  const activeUtilities = UTILITIES.filter(u =>
    visiblePeriods.some(p => (chartData[p]?.[u.id] || 0) > 0)
  ).map(u => u.id);

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
            <Bar key={utility} dataKey={utility} fill={COLORS[utility]} radius={[4, 4, 0, 0]} name={utility} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UtilityChart;
