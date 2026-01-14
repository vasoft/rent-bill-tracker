import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { meterReadings, spaces, clients } from '@/data/mockData';
import { UTILITIES, UtilityType } from '@/types/utility';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Search, Gauge, Calendar, Zap, Flame } from 'lucide-react';
import { UtilityType } from '@/types/utility';

const MeterReadings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [utilityFilter, setUtilityFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('2025-12');

  const readingsWithDetails = meterReadings.map(reading => {
    const space = spaces.find(s => s.id === reading.spaceId);
    const client = space?.clientId ? clients.find(c => c.id === space.clientId) : null;
    const utility = UTILITIES.find(u => u.id === reading.utilityType);
    
    return {
      ...reading,
      spaceName: space?.name || 'Necunoscut',
      clientName: client?.name || 'Liber',
      utilityName: utility?.fullName || reading.utilityType,
      unit: utility?.unit || '',
    };
  });

  const filteredReadings = readingsWithDetails.filter(reading => {
    const matchesSearch = reading.spaceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reading.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUtility = utilityFilter === 'all' || reading.utilityType === utilityFilter;
    const matchesPeriod = reading.period === periodFilter;
    
    return matchesSearch && matchesUtility && matchesPeriod;
  });

  const getUtilityIcon = (type: UtilityType) => {
    switch (type) {
      case 'EE': return <Zap className="w-4 h-4" />;
      case 'GN': return <Flame className="w-4 h-4" />;
      default: return <Gauge className="w-4 h-4" />;
    }
  };

  const getUtilityColor = (type: UtilityType) => {
    const colors: Record<UtilityType, string> = {
      EE: 'bg-chart-ee/10 text-chart-ee border-chart-ee/30',
      GN: 'bg-chart-gn/10 text-chart-gn border-chart-gn/30',
      AC: 'bg-chart-ac/10 text-chart-ac border-chart-ac/30',
      AA: 'bg-chart-aa/10 text-chart-aa border-chart-aa/30',
      SM: 'bg-chart-sm/10 text-chart-sm border-chart-sm/30',
      AS: 'bg-chart-as/10 text-chart-as border-chart-as/30',
      SSV: 'bg-chart-sm/10 text-chart-sm border-chart-sm/30',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const totalConsumption = filteredReadings.reduce((sum, r) => sum + r.consumption, 0);

  return (
    <MainLayout title="Indexe Contori" subtitle="Înregistrarea și gestionarea indexelor aparatelor de măsură">
      <div className="space-y-6 animate-slide-up">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gauge className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredReadings.length}</p>
                <p className="text-sm text-muted-foreground">Citiri Înregistrate</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-ee/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-chart-ee" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredReadings.filter(r => r.utilityType === 'EE').reduce((s, r) => s + r.consumption, 0).toLocaleString('ro-RO')}
                </p>
                <p className="text-sm text-muted-foreground">kWh Energie Electrică</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-gn/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-chart-gn" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredReadings.filter(r => r.utilityType === 'GN').reduce((s, r) => s + r.consumption, 0).toLocaleString('ro-RO', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground">Nmc Gaze Naturale</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Caută spațiu sau client..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={utilityFilter} onValueChange={setUtilityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Utilitate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate Utilitățile</SelectItem>
                <SelectItem value="EE">Energie Electrică</SelectItem>
                <SelectItem value="GN">Gaze Naturale</SelectItem>
                <SelectItem value="AC">Apă și Canalizare</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Perioadă" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-12">Dec 2025</SelectItem>
                <SelectItem value="2025-11">Nov 2025</SelectItem>
                <SelectItem value="2025-10">Oct 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Adaugă Citire
          </Button>
        </div>

        {/* Table */}
        <div className="utility-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Spațiu</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Utilitate</TableHead>
                <TableHead className="text-right">Index Vechi</TableHead>
                <TableHead className="text-right">Index Nou</TableHead>
                <TableHead className="text-right">Constantă</TableHead>
                <TableHead className="text-right">Consum</TableHead>
                <TableHead>Data Citirii</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReadings.map((reading) => (
                <TableRow key={reading.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{reading.spaceName}</TableCell>
                  <TableCell className="text-muted-foreground">{reading.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`gap-1.5 ${getUtilityColor(reading.utilityType)}`}>
                      {getUtilityIcon(reading.utilityType)}
                      {reading.utilityType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{reading.indexOld.toLocaleString('ro-RO')}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{reading.indexNew.toLocaleString('ro-RO')}</TableCell>
                  <TableCell className="text-right">{reading.constant}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {reading.consumption.toLocaleString('ro-RO')} {reading.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(reading.readingDate).toLocaleDateString('ro-RO')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
};

export default MeterReadings;
