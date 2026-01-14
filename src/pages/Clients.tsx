import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { clients, spaces, getClientTotalByPeriod } from '@/data/mockData';
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
import { Plus, Search, Edit, Users, Building2, TrendingUp } from 'lucide-react';

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const clientsWithDetails = clients.map(client => {
    const clientSpaces = spaces.filter(s => s.clientId === client.id);
    const totalArea = clientSpaces.reduce((sum, s) => sum + s.area, 0);
    const totalPersons = clientSpaces.reduce((sum, s) => sum + s.persons, 0);
    const currentTotal = getClientTotalByPeriod(client.id, '2025-12');
    
    return {
      ...client,
      spacesCount: clientSpaces.length,
      spaceNames: clientSpaces.map(s => s.id).join(', '),
      totalArea,
      totalPersons,
      currentTotal,
    };
  });

  const filteredClients = clientsWithDetails.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout title="Clienți" subtitle="Gestiunea clienților și chiriașilor">
      <div className="space-y-6 animate-slide-up">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-sm text-muted-foreground">Total Clienți</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.filter(c => c.type === 'PJ').length}</p>
                <p className="text-sm text-muted-foreground">Persoane Juridice</p>
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
                  {clientsWithDetails.reduce((sum, c) => sum + c.currentTotal, 0).toLocaleString('ro-RO')} lei
                </p>
                <p className="text-sm text-muted-foreground">Total Consum Luna</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Caută client..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Adaugă Client
          </Button>
        </div>

        {/* Table */}
        <div className="utility-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>Denumire</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Spații</TableHead>
                <TableHead className="text-right">Suprafață (mp)</TableHead>
                <TableHead className="text-right">Persoane</TableHead>
                <TableHead className="text-right">Consum Luna</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{client.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {client.name.split(' ')[1]?.[0] || client.name[0]}
                      </div>
                      <span className="font-medium">{client.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.type === 'PJ' ? 'default' : 'secondary'}>
                      {client.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{client.spaceNames || '-'}</span>
                  </TableCell>
                  <TableCell className="text-right">{client.totalArea.toLocaleString('ro-RO')}</TableCell>
                  <TableCell className="text-right">{client.totalPersons}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {client.currentTotal.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
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

export default Clients;
