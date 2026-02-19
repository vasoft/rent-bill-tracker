import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { spaces as initialSpaces, clients as initialClients } from '@/data/mockData';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Building2, Users, Square, Trash2 } from 'lucide-react';
import { Space, Client } from '@/types/utility';
import { SpaceForm } from '@/components/spaces/SpaceForm';
import UnifiedClientForm from '@/components/spaces-clients/UnifiedClientForm';

const SpacesClients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [spacesList, setSpacesList] = useState<Space[]>(initialSpaces);
  const [clientsList, setClientsList] = useState<Client[]>(initialClients);
  
  // Space form state
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const [spaceFormMode, setSpaceFormMode] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  
  // Client form state
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [clientFormMode, setClientFormMode] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Filtered data
  const filteredSpaces = spacesList.filter(space => 
    space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clientsList.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const totalArea = spacesList.reduce((sum, s) => sum + s.area, 0);
  const occupiedSpaces = spacesList.filter(s => s.clientId).length;
  const totalPersons = spacesList.reduce((sum, s) => sum + s.persons, 0);

  // Helper functions
  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'Liber';
    const client = clientsList.find(c => c.id === clientId);
    return client?.name || 'Necunoscut';
  };

  const getClientPersons = (clientId: string): number => {
    return spacesList
      .filter(s => s.clientId === clientId)
      .reduce((sum, s) => sum + s.persons, 0);
  };

  const getClientSpaceNames = (client: Client): string => {
    return client.spaces.join(', ') || '-';
  };

  const getClientTotalArea = (client: Client): number => {
    return spacesList
      .filter(s => client.spaces.includes(s.id))
      .reduce((sum, s) => sum + s.area, 0);
  };

  // Space handlers
  const handleOpenAddSpace = () => {
    setSelectedSpace(null);
    setSpaceFormMode('add');
    setSpaceFormOpen(true);
  };

  const handleOpenEditSpace = (space: Space) => {
    setSelectedSpace(space);
    setSpaceFormMode('edit');
    setSpaceFormOpen(true);
  };

  const handleOpenDeleteSpace = (space: Space) => {
    setSelectedSpace(space);
    setSpaceFormMode('delete');
    setSpaceFormOpen(true);
  };

  const handleSpaceFormSubmit = (data: { id: string; name: string; area: number; racordEE?: string; racordGN?: string; racordAA?: string }, mode: 'add' | 'edit' | 'delete') => {
    if (mode === 'add') {
      const newSpace: Space = {
        id: data.id,
        name: data.name,
        area: data.area,
        persons: 0,
        clientId: null,
        racordEE: data.racordEE ?? '',
        racordGN: data.racordGN ?? '',
        racordAA: data.racordAA ?? '',
      };
      setSpacesList(prev => [...prev, newSpace]);
    } else if (mode === 'edit') {
      setSpacesList(prev => 
        prev.map(s => s.id === selectedSpace?.id 
          ? { ...s, name: data.name, area: data.area, racordEE: data.racordEE ?? s.racordEE, racordGN: data.racordGN ?? s.racordGN, racordAA: data.racordAA ?? s.racordAA }
          : s
        )
      );
    } else if (mode === 'delete') {
      setSpacesList(prev => prev.filter(s => s.id !== data.id));
    }
  };

  // Client handlers
  const handleOpenAddClient = () => {
    setSelectedClient(null);
    setClientFormMode('add');
    setClientFormOpen(true);
  };

  const handleOpenEditClient = (client: Client) => {
    setSelectedClient(client);
    setClientFormMode('edit');
    setClientFormOpen(true);
  };

  const handleOpenDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setClientFormMode('delete');
    setClientFormOpen(true);
  };

  const handleClientFormSubmit = (
    data: { id: string; name: string; type: 'PJ' | 'PF'; spaces: string[]; persons: number }, 
    mode: 'add' | 'edit' | 'delete'
  ) => {
    if (mode === 'add') {
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
        prev.map((space) => {
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

  const existingSpaceIds = spacesList.map(s => s.id);
  const existingClientIds = clientsList.map(c => c.id);

  return (
    <MainLayout title="Spații & Clienți" subtitle="Gestiunea spațiilor și clienților">
      <div className="space-y-6 animate-slide-up">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{spacesList.length}</p>
                <p className="text-sm text-muted-foreground">Total Spații</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{occupiedSpaces}</p>
                <p className="text-sm text-muted-foreground">Spații Ocupate</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clientsList.length}</p>
                <p className="text-sm text-muted-foreground">Total Clienți</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-gn/10 flex items-center justify-center">
                <Square className="w-5 h-5 text-chart-gn" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalArea.toLocaleString('ro-RO')}</p>
                <p className="text-sm text-muted-foreground">Suprafață Totală (mp)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Caută spațiu sau client..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs for Spaces and Clients */}
        <Tabs defaultValue="spaces" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="spaces" className="gap-2">
              <Building2 className="w-4 h-4" />
              Spații
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="w-4 h-4" />
              Clienți
            </TabsTrigger>
          </TabsList>

          {/* Spaces Tab */}
          <TabsContent value="spaces" className="space-y-4">
            <div className="flex justify-end">
              <Button className="gap-2" onClick={handleOpenAddSpace}>
                <Plus className="w-4 h-4" />
                Adaugă Spațiu
              </Button>
            </div>

            <div className="utility-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>ID</TableHead>
                    <TableHead>Denumire</TableHead>
                    <TableHead className="text-right">Suprafață (mp)</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSpaces.map((space) => (
                    <TableRow key={space.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{space.id}</TableCell>
                      <TableCell className="font-medium">{space.name}</TableCell>
                      <TableCell className="text-right">{space.area.toLocaleString('ro-RO')}</TableCell>
                      <TableCell>{getClientName(space.clientId)}</TableCell>
                      <TableCell>
                        <Badge variant={space.clientId ? "default" : "secondary"}>
                          {space.clientId ? 'Ocupat' : 'Liber'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenEditSpace(space)}
                            title="Modifică suprafață"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenDeleteSpace(space)}
                            title="Șterge spațiu"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSpaces.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nu au fost găsite spații
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <div className="flex justify-end">
              <Button className="gap-2" onClick={handleOpenAddClient}>
                <Plus className="w-4 h-4" />
                Adaugă Client
              </Button>
            </div>

            <div className="utility-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>ID</TableHead>
                    <TableHead>Denumire</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead className="text-right">Persoane</TableHead>
                    <TableHead>Spații</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{client.id}</TableCell>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        <Badge variant={client.type === 'PJ' ? 'default' : 'secondary'}>
                          {client.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{getClientPersons(client.id)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {getClientSpaceNames(client)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenEditClient(client)}
                            title="Modifică persoane"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenDeleteClient(client)}
                            title="Șterge client"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredClients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nu au fost găsiți clienți
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Space Form Dialog */}
        <SpaceForm
          open={spaceFormOpen}
          onOpenChange={setSpaceFormOpen}
          mode={spaceFormMode}
          space={selectedSpace}
          existingIds={existingSpaceIds}
          onSubmit={handleSpaceFormSubmit}
        />

        {/* Client Form Dialog */}
        <UnifiedClientForm
          open={clientFormOpen}
          onOpenChange={setClientFormOpen}
          mode={clientFormMode}
          client={selectedClient}
          existingIds={existingClientIds}
          availableSpaces={spacesList}
          clientSpacesPersons={selectedClient ? getClientPersons(selectedClient.id) : 0}
          onSubmit={handleClientFormSubmit}
        />
      </div>
    </MainLayout>
  );
};

export default SpacesClients;
