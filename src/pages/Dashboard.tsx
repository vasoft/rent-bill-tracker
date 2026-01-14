import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import UtilityChart from '@/components/dashboard/UtilityChart';
import UtilityBreakdown from '@/components/dashboard/UtilityBreakdown';
import ClientsTable from '@/components/dashboard/ClientsTable';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentInvoices from '@/components/dashboard/RecentInvoices';
import { monthlyStats, clients, spaces, supplierInvoices } from '@/data/mockData';
import { Zap, Droplets, Flame, Users, Building2, FileText } from 'lucide-react';

const Dashboard = () => {
  const currentStats = monthlyStats[0];
  const previousStats = monthlyStats[1];
  
  const totalValue = currentStats.totalValue;
  const previousTotal = previousStats.totalValue;
  const valueChange = ((totalValue - previousTotal) / previousTotal) * 100;
  
  const eeStats = currentStats.byUtility.find(u => u.utilityType === 'EE');
  const acStats = currentStats.byUtility.find(u => u.utilityType === 'AC');
  const gnStats = currentStats.byUtility.find(u => u.utilityType === 'GN');

  const activeClients = clients.filter(c => 
    spaces.some(s => s.clientId === c.id)
  ).length;

  const occupiedSpaces = spaces.filter(s => s.clientId !== null).length;

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle="Gestiune Utilități și Servicii - Decembrie 2025"
    >
      <div className="space-y-6 animate-slide-up">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Utilități Luna"
            value={`${totalValue.toLocaleString('ro-RO')} lei`}
            trend={{ value: valueChange, label: 'vs. luna trecută' }}
            icon={<FileText className="w-5 h-5" />}
            iconBgClass="bg-primary/10 text-primary"
          />
          <StatCard
            title="Energie Electrică"
            value={`${eeStats?.consumption.toLocaleString('ro-RO')} kWh`}
            subtitle={`${eeStats?.value.toLocaleString('ro-RO')} lei`}
            icon={<Zap className="w-5 h-5" />}
            iconBgClass="bg-chart-ee/10 text-chart-ee"
          />
          <StatCard
            title="Apă și Canalizare"
            value={`${acStats?.consumption.toLocaleString('ro-RO')} mc`}
            subtitle={`${acStats?.value.toLocaleString('ro-RO')} lei`}
            icon={<Droplets className="w-5 h-5" />}
            iconBgClass="bg-chart-ac/10 text-chart-ac"
          />
          <StatCard
            title="Gaze Naturale"
            value={`${gnStats?.consumption.toLocaleString('ro-RO')} Nmc`}
            subtitle={`${gnStats?.value.toLocaleString('ro-RO')} lei`}
            icon={<Flame className="w-5 h-5" />}
            iconBgClass="bg-chart-gn/10 text-chart-gn"
          />
          <StatCard
            title="Clienți Activi"
            value={activeClients}
            subtitle={`din ${clients.length} total`}
            icon={<Users className="w-5 h-5" />}
            iconBgClass="bg-success/10 text-success"
          />
          <StatCard
            title="Spații Ocupate"
            value={occupiedSpaces}
            subtitle={`din ${spaces.length} total`}
            icon={<Building2 className="w-5 h-5" />}
            iconBgClass="bg-accent/10 text-accent"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <UtilityChart />
          </div>
          <UtilityBreakdown />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ClientsTable />
          </div>
          <div className="space-y-6">
            <QuickActions />
            <RecentInvoices />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
