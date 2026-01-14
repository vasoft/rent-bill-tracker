import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { UTILITIES, UtilityType } from '@/types/utility';
import { monthlyStats } from '@/data/mockData';

const UtilityChart = () => {
  const data = monthlyStats.slice(0, 6).reverse().map(stat => {
    const [year, month] = stat.period.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ro-RO', { month: 'short' });
    
    const result: Record<string, string | number> = { 
      name: monthName.charAt(0).toUpperCase() + monthName.slice(1)
    };
    
    stat.byUtility.forEach(u => {
      result[u.utilityType] = u.value;
    });
    
    return result;
  });

  const mainUtilities = ['EE', 'AC', 'GN', 'SM'] as UtilityType[];
  
  const colors: Record<UtilityType, string> = {
    EE: '#3B82F6',
    GN: '#F59E0B',
    AC: '#06B6D4',
    AA: '#10B981',
    SM: '#8B5CF6',
    AS: '#14B8A6',
    SSV: '#EC4899',
  };

  return (
    <div className="utility-card h-80">
      <h3 className="font-semibold text-foreground mb-4">Evoluție Costuri Utilități</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number) => [`${value.toLocaleString('ro-RO')} lei`, '']}
          />
          <Legend 
            formatter={(value) => UTILITIES.find(u => u.id === value)?.name || value}
          />
          {mainUtilities.map((utility) => (
            <Bar 
              key={utility}
              dataKey={utility} 
              fill={colors[utility]}
              radius={[4, 4, 0, 0]}
              name={utility}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UtilityChart;
