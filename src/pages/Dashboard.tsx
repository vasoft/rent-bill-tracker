import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import UtilityChart from '@/components/dashboard/UtilityChart';
import UtilityBreakdown from '@/components/dashboard/UtilityBreakdown';
import ClientsTable from '@/components/dashboard/ClientsTable';
import RecentInvoices from '@/components/dashboard/RecentInvoices';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Zap, Droplets, Flame, Users, Building2, FileText, CalendarDays, Beaker, Waves, Wrench, Video, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Dashboard = () => {
  const { ready, periods, selectedPeriod, setSelectedPeriod, periodData, chartData } = useDashboardData();

  if (!ready || !periodData) {
    return (
      <MainLayout title="Dashboard" subtitle="Se încarcă...">
        <div className="flex items-center justify-center h-64 text-muted-foreground">Se încarcă datele...</div>
      </MainLayout>
    );
  }

  const formatPeriodLabel = (p: string) => {
    const [y, m] = p.split('-').map(Number);
    const date = new Date(y, m - 1);
    const name = date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Find previous period data for trend
  const currentIdx = periods.indexOf(selectedPeriod);
  const previousPeriod = currentIdx < periods.length - 1 ? periods[currentIdx + 1] : null;
  const previousTotal = previousPeriod
    ? Object.values(chartData[previousPeriod] || {}).reduce((s, v) => s + v, 0)
    : null;
  const valueChange = previousTotal && previousTotal > 0
    ? ((periodData.totalValue - previousTotal) / previousTotal) * 100
    : null;

  const getStats = (type: string) => periodData.byUtility.find(u => u.utilityType === type);
  const eeStats = getStats('EE');
  const acStats = getStats('AC');
  const gnStats = getStats('GN');
  const aaStats = getStats('AA');
  const asStats = getStats('AS');
  const smStats = getStats('SM');
  const ssvStats = getStats('SSV');
  const scStats = getStats('SC');

  return (
    <MainLayout
      title="Dashboard"
      subtitle={`Gestiune Utilități și Servicii - ${formatPeriodLabel(selectedPeriod)}`}
    >
      <div className="space-y-6 animate-slide-up">
        {/* Period Selector */}
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-muted-foreground" />
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selectează perioada" />
            </SelectTrigger>
            <SelectContent>
              {periods.map(p => (
                <SelectItem key={p} value={p}>
                  {formatPeriodLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Grid - Row 1: Total + Metered Utilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Utilități Luna"
            value={`${periodData.totalValue.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`}
            trend={valueChange !== null ? { value: Math.round(valueChange * 100) / 100, label: 'vs. luna trecută' } : undefined}
            icon={<FileText className="w-4 h-4" />}
            iconBgClass="bg-primary/10 text-primary"
          />
          <StatCard
            title="Energie Electrică"
            value={`${(eeStats?.consumption || 0).toLocaleString('ro-RO')} kWh`}
            subtitle={`${(eeStats?.totalValue || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei`}
            icon={<Zap className="w-4 h-4" />}
            iconBgClass="bg-chart-ee/10 text-chart-ee"
          />
          <StatCard
            title="Apă și Canalizare"
            value={`${(acStats?.consumption || 0).toLocaleString('ro-RO')} mc`}
            subtitle={`${(acStats?.totalValue || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei`}
            icon={<Droplets className="w-4 h-4" />}
            iconBgClass="bg-chart-ac/10 text-chart-ac"
          />
          <StatCard
            title="Gaze Naturale"
            value={`${(gnStats?.consumption || 0).toLocaleString('ro-RO')} Nmc`}
            subtitle={`${(gnStats?.totalValue || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei`}
            icon={<Flame className="w-4 h-4" />}
            iconBgClass="bg-chart-gn/10 text-chart-gn"
          />
        </div>

        {/* Stats Grid - Row 2: Services + Occupancy */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard
            title="Analize Ape Uzate"
            value={`${(aaStats?.totalValue || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei`}
            subtitle={aaStats?.consumption ? `${aaStats.consumption.toLocaleString('ro-RO')} buc` : undefined}
            icon={<Beaker className="w-4 h-4" />}
            iconBgClass="bg-chart-aa/10 text-chart-aa"
          />
          <StatCard
            title="Apă din Subteran"
            value={`${(asStats?.totalValue || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei`}
            subtitle={asStats?.consumption ? `${asStats.consumption.toLocaleString('ro-RO')} mc` : undefined}
            icon={<Waves className="w-4 h-4" />}
            iconBgClass="bg-chart-as/10 text-chart-as"
          />
          <StatCard
            title="Mentenanță"
            value={`${(smStats?.totalValue || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei`}
            icon={<Wrench className="w-4 h-4" />}
            iconBgClass="bg-chart-sm/10 text-chart-sm"
          />
          <StatCard
            title="Supraveghere Video"
            value={`${(ssvStats?.totalValue || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei`}
            icon={<Video className="w-4 h-4" />}
            iconBgClass="bg-chart-ssv/10 text-chart-ssv"
          />
          <StatCard
            title="Curățenie"
            value={`${(scStats?.totalValue || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei`}
            icon={<Sparkles className="w-4 h-4" />}
            iconBgClass="bg-chart-sc/10 text-chart-sc"
          />
          <StatCard
            title="Clienți Activi"
            value={periodData.activeClients}
            icon={<Users className="w-4 h-4" />}
            iconBgClass="bg-success/10 text-success"
          />
          <StatCard
            title="Spații Ocupate"
            value={periodData.occupiedSpaces}
            icon={<Building2 className="w-4 h-4" />}
            iconBgClass="bg-accent/10 text-accent"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <UtilityChart chartData={chartData} selectedPeriod={selectedPeriod} />
          </div>
          <UtilityBreakdown data={periodData.byUtility} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ClientsTable data={periodData.byClient} periodLabel={formatPeriodLabel(selectedPeriod)} />
          </div>
          <div className="space-y-6">
            <RecentInvoices period={selectedPeriod} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
