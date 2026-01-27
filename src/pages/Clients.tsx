import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { clients as initialClients, spaces as initialSpaces, getClientTotalByPeriod } from '@/data/mockData';
import { Client, Space } from '@/types/utility';
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
import { Plus, Search, Edit, Users, Building2, TrendingUp, Trash2 } from 'lucide-react';
import ClientForm from '@/components/clients/ClientForm';

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientsList, setClientsList] = useState<Client[]>(initialClients);
  const [spacesList, setSpacesList] = useState<Space[]>(initialSpaces);
  
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Calculate client details with spaces info
  const clientsWithDetails = clientsList.map(client => {
    const clientSpaces = spacesList.filter(s => s.clientId === client.id);
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

  const openAddForm = () => {
    setSelectedClient(null);
    setFormMode('add');
    setFormOpen(true);
  };

  const openEditForm = (client: Client) => {
    setSelectedClient(client);
    setFormMode('edit');
    setFormOpen(true);
  };

  const openDeleteForm = (client: Client) => {
    setSelectedClient(client);
    setFormMode('delete');
    setFormOpen(true);
  };

  const getClientPersons = (clientId: string): number => {
    return spacesList
      .filter(s => s.clientId === clientId)
      .reduce((sum, s) => sum + s.persons, 0);
  };

  const handleFormSubmit = (
    data: { id: string; name: string; type: 'PJ' | 'PF'; spaces: string[]; persons: number }, 
    mode: 'add' | 'edit' | 'delete'
  ) => {
    if (mode === 'add') {
      // Add new client
      const newClient: Client = {
        id: data.id,
        name: data.name,
        type: data.type,
        spaces: data.spaces,
      };
      setClientsList(prev => [...prev, newClient]);
      
      // Update spaces with clientId and distribute persons
      const personsPerSpace = data.spaces.length > 0 
        ? Math.floor(data.persons / data.spaces.length) 
        : 0;
      const remainder = data.spaces.length > 0 
        ? data.persons % data.spaces.length 
        : 0;
      
      setSpacesList(prev => 
        prev.map((space, idx) => {
          if (data.spaces.includes(space.id)) {
            const spaceIndex = data.spaces.indexOf(space.id);
            return {
              ...space,
              clientId: data.id,
              persons: personsPerSpace + (spaceIndex < remainder ? 1 : 0),
            };
          }
          return space;
        })
      );
    } else if (mode === 'edit') {
      // Only update persons (distributed across spaces)
      const clientSpaces = spacesList.filter(s => s.clientId === selectedClient?.id);
      const personsPerSpace = clientSpaces.length > 0 
        ? Math.floor(data.persons / clientSpaces.length) 
        : 0;
      const remainder = clientSpaces.length > 0 
        ? data.persons % clientSpaces.length 
        : 0;
      
      setSpacesList(prev => 
        prev.map((space) => {
          if (space.clientId === selectedClient?.id) {
            const spaceIndex = clientSpaces.findIndex(s => s.id === space.id);
            return {
              ...space,
              persons: personsPerSpace + (spaceIndex < remainder ? 1 : 0),
            };
          }
          return space;
        })
      );
    } else if (mode === 'delete') {
      // Remove client
      setClientsList(prev => prev.filter(c => c.id !== data.id));
      
      // Clear clientId and persons from spaces
      setSpacesList(prev => 
        prev.map(space => 
          space.clientId === data.id 
            ? { ...space, clientId: null, persons: 0 } 
            : space
        )
      );
    }
  };

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
                <p className="text-2xl font-bold">{clientsList.length}</p>
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
                <p className="text-2xl font-bold">{clientsList.filter(c => c.type === 'PJ').length}</p>
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
          <Button className="gap-2" onClick={openAddForm}>
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
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditForm(client)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteForm(client)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nu au fost găsiți clienți
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Client Form Dialog */}
        <ClientForm
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          client={selectedClient}
          existingIds={clientsList.map(c => c.id)}
          availableSpaces={spacesList}
          clientSpacesPersons={selectedClient ? getClientPersons(selectedClient.id) : 0}
          onSubmit={handleFormSubmit}
        />
      </div>
    </MainLayout>
  );
};

export default Clients;
