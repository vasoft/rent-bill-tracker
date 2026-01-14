import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { monthlyStats } from '@/data/mockData';
import { UTILITIES, UtilityType } from '@/types/utility';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History as HistoryIcon, TrendingUp, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { UtilityType } from '@/types/utility';

const History = () => {
  const [selectedUtility, setSelectedUtility] = useState<string>('all');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  const chartData = monthlyStats.slice().reverse().map(stat => {
    const [year, month] = stat.period.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ro-RO', { month: 'short' });
    
    const result: Record<string, string | number> = { 
      name: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year.slice(2)}`,
      total: stat.totalValue,
    };
    
    stat.byUtility.forEach(u => {
      result[`${u.utilityType}_value`] = u.value;
      result[`${u.utilityType}_consumption`] = u.consumption;
    });
    
    return result;
  });

  const colors: Record<UtilityType, string> = {
    EE: '#3B82F6',
    GN: '#F59E0B',
    AC: '#06B6D4',
    AA: '#10B981',
    SM: '#8B5CF6',
    AS: '#14B8A6',
    SSV: '#EC4899',
  };

  const calculateTrend = (utilityType?: UtilityType) => {
    const latest = monthlyStats[0];
    const previous = monthlyStats[1];
    
    if (utilityType) {
      const latestValue = latest.byUtility.find(u => u.utilityType === utilityType)?.value || 0;
      const previousValue = previous.byUtility.find(u => u.utilityType === utilityType)?.value || 0;
      return previousValue > 0 ? ((latestValue - previousValue) / previousValue) * 100 : 0;
    }
    
    return ((latest.totalValue - previous.totalValue) / previous.totalValue) * 100;
  };

  const totalAverage = monthlyStats.reduce((sum, s) => sum + s.totalValue, 0) / monthlyStats.length;

  return (
    <MainLayout title="Istoric Consumuri" subtitle="Evoluția consumurilor și costurilor în timp">
      <div className="space-y-6 animate-slide-up">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <HistoryIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{monthlyStats.length}</p>
                <p className="text-sm text-muted-foreground">Luni Înregistrate</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAverage.toLocaleString('ro-RO', { maximumFractionDigits: 0 })} lei</p>
                <p className="text-sm text-muted-foreground">Medie Lunară</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-ee/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-chart-ee" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {calculateTrend() > 0 ? '+' : ''}{calculateTrend().toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Trend Total</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-gn/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-chart-gn" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {calculateTrend('GN') > 0 ? '+' : ''}{calculateTrend('GN').toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Trend Gaze</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <Select value={selectedUtility} onValueChange={setSelectedUtility}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selectează utilitate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate Utilitățile</SelectItem>
              {UTILITIES.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'line' | 'area')}>
            <TabsList>
              <TabsTrigger value="area" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Arie
              </TabsTrigger>
              <TabsTrigger value="line" className="gap-2">
                <LineChartIcon className="w-4 h-4" />
                Linie
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Value Chart */}
        <div className="utility-card h-96">
          <h3 className="font-semibold text-foreground mb-4">Evoluție Costuri (lei)</h3>
          <ResponsiveContainer width="100%" height="85%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  {(selectedUtility === 'all' ? UTILITIES : UTILITIES.filter(u => u.id === selectedUtility)).map(utility => (
                    <linearGradient key={utility.id} id={`gradient-${utility.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[utility.id]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={colors[utility.id]} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
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
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('ro-RO')} lei`, '']}
                />
                <Legend />
                {(selectedUtility === 'all' ? UTILITIES.slice(0, 4) : UTILITIES.filter(u => u.id === selectedUtility)).map(utility => (
                  <Area 
                    key={utility.id}
                    type="monotone"
                    dataKey={`${utility.id}_value`}
                    stroke={colors[utility.id]}
                    fill={`url(#gradient-${utility.id})`}
                    name={utility.fullName}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('ro-RO')} lei`, '']}
                />
                <Legend />
                {(selectedUtility === 'all' ? UTILITIES.slice(0, 4) : UTILITIES.filter(u => u.id === selectedUtility)).map(utility => (
                  <Line 
                    key={utility.id}
                    type="monotone"
                    dataKey={`${utility.id}_value`}
                    stroke={colors[utility.id]}
                    name={utility.fullName}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Summary Table */}
        <div className="utility-card">
          <h3 className="font-semibold text-foreground mb-4">Rezumat Istoric</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-semibold">Perioada</th>
                  {UTILITIES.slice(0, 5).map(u => (
                    <th key={u.id} className="text-right py-3 px-2 font-semibold" style={{ color: colors[u.id] }}>
                      {u.name}
                    </th>
                  ))}
                  <th className="text-right py-3 px-2 font-semibold">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map((stat, index) => {
                  const [year, month] = stat.period.split('-');
                  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
                  
                  return (
                    <tr key={stat.period} className={`border-b border-border/50 ${index === 0 ? 'bg-primary/5' : ''}`}>
                      <td className="py-3 px-2 font-medium capitalize">{monthName}</td>
                      {UTILITIES.slice(0, 5).map(u => {
                        const utilityData = stat.byUtility.find(bu => bu.utilityType === u.id);
                        return (
                          <td key={u.id} className="text-right py-3 px-2">
                            {utilityData?.value.toLocaleString('ro-RO') || '-'}
                          </td>
                        );
                      })}
                      <td className="text-right py-3 px-2 font-bold">
                        {stat.totalValue.toLocaleString('ro-RO')} lei
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default History;
