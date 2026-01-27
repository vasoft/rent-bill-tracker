import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { spaces as initialSpaces, clients } from '@/data/mockData';
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
import { Plus, Search, Edit, Building2, Users, Square, Trash2 } from 'lucide-react';
import { Space } from '@/types/utility';
import { SpaceForm } from '@/components/spaces/SpaceForm';

const Spaces = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [spacesList, setSpacesList] = useState<Space[]>(initialSpaces);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

  const filteredSpaces = spacesList.filter(space => 
    space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'Liber';
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Necunoscut';
  };

  const totalArea = spacesList.reduce((sum, s) => sum + s.area, 0);
  const occupiedSpaces = spacesList.filter(s => s.clientId).length;
  const totalPersons = spacesList.reduce((sum, s) => sum + s.persons, 0);

  const handleOpenAdd = () => {
    setSelectedSpace(null);
    setFormMode('add');
    setFormOpen(true);
  };

  const handleOpenEdit = (space: Space) => {
    setSelectedSpace(space);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleOpenDelete = (space: Space) => {
    setSelectedSpace(space);
    setFormMode('delete');
    setFormOpen(true);
  };

  const handleFormSubmit = (data: { id: string; name: string; area: number }, mode: 'add' | 'edit' | 'delete') => {
    if (mode === 'add') {
      const newSpace: Space = {
        id: data.id,
        name: data.name,
        area: data.area,
        persons: 0, // Persoanele sunt gestionate prin Clienți
        clientId: null,
      };
      setSpacesList(prev => [...prev, newSpace]);
    } else if (mode === 'edit') {
      setSpacesList(prev => 
        prev.map(s => s.id === selectedSpace?.id 
          ? { ...s, name: data.name, area: data.area }
          : s
        )
      );
    } else if (mode === 'delete') {
      setSpacesList(prev => prev.filter(s => s.id !== data.id));
    }
  };

  const existingIds = spacesList.map(s => s.id);

  return (
    <MainLayout title="Spații" subtitle="Gestiunea spațiilor și imobilelor">
      <div className="space-y-6 animate-slide-up">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Square className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalArea.toLocaleString('ro-RO')}</p>
                <p className="text-sm text-muted-foreground">Suprafață Totală (mp)</p>
              </div>
            </div>
          </div>
          <div className="utility-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-gn/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-chart-gn" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPersons}</p>
                <p className="text-sm text-muted-foreground">Total Persoane</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Caută spațiu..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="gap-2" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4" />
            Adaugă Spațiu
          </Button>
        </div>

        {/* Table */}
        <div className="utility-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>Denumire</TableHead>
                <TableHead className="text-right">Suprafață (mp)</TableHead>
                <TableHead className="text-right">Persoane</TableHead>
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
                  <TableCell className="text-right">{space.persons}</TableCell>
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
                        onClick={() => handleOpenEdit(space)}
                        title="Modifică spațiu"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenDelete(space)}
                        title="Șterge spațiu"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Space Form Dialog */}
        <SpaceForm
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          space={selectedSpace}
          existingIds={existingIds}
          onSubmit={handleFormSubmit}
        />
      </div>
    </MainLayout>
  );
};

export default Spaces;
