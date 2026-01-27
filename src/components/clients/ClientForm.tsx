import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Client, Space } from '@/types/utility';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';

const clientSchema = z.object({
  id: z.string().min(1, 'ID-ul este obligatoriu').max(10, 'ID-ul trebuie să aibă maxim 10 caractere'),
  name: z.string().min(1, 'Denumirea este obligatorie').max(100, 'Denumirea trebuie să aibă maxim 100 caractere'),
  type: z.enum(['PJ', 'PF'], { required_error: 'Selectați tipul de persoană' }),
  spaces: z.array(z.string()).min(1, 'Selectați cel puțin un spațiu'),
  persons: z.coerce.number().min(0, 'Numărul de persoane nu poate fi negativ').int('Numărul de persoane trebuie să fie întreg'),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit' | 'delete';
  client?: Client | null;
  existingIds: string[];
  availableSpaces: Space[];
  clientSpacesPersons: number; // Current persons count for the client
  onSubmit: (data: ClientFormValues, mode: 'add' | 'edit' | 'delete') => void;
}

const ClientForm = ({
  open,
  onOpenChange,
  mode,
  client,
  existingIds,
  availableSpaces,
  clientSpacesPersons,
  onSubmit,
}: ClientFormProps) => {
  const { toast } = useToast();
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      id: '',
      name: '',
      type: 'PJ',
      spaces: [],
      persons: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === 'add') {
        form.reset({
          id: '',
          name: '',
          type: 'PJ',
          spaces: [],
          persons: 0,
        });
        setSelectedSpaces([]);
      } else if (client) {
        form.reset({
          id: client.id,
          name: client.name,
          type: client.type,
          spaces: client.spaces,
          persons: clientSpacesPersons,
        });
        setSelectedSpaces(client.spaces);
      }
    }
  }, [open, mode, client, clientSpacesPersons, form]);

  const handleSubmitForm = (data: ClientFormValues) => {
    // Check for duplicate ID only on add
    if (mode === 'add' && existingIds.includes(data.id)) {
      form.setError('id', { message: 'Acest ID există deja' });
      return;
    }

    onSubmit({ ...data, spaces: selectedSpaces }, mode);
    onOpenChange(false);
    toast({
      title: 'Succes',
      description: mode === 'add' 
        ? 'Clientul a fost adăugat cu succes' 
        : 'Clientul a fost modificat cu succes',
    });
  };

  const handleDelete = () => {
    if (client) {
      onSubmit({ 
        id: client.id, 
        name: client.name, 
        type: client.type, 
        spaces: client.spaces, 
        persons: clientSpacesPersons 
      }, 'delete');
      onOpenChange(false);
      toast({
        title: 'Succes',
        description: 'Clientul a fost șters cu succes',
      });
    }
  };

  const handleSpaceToggle = (spaceId: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedSpaces, spaceId]
      : selectedSpaces.filter(id => id !== spaceId);
    
    setSelectedSpaces(newSelection);
    form.setValue('spaces', newSelection, { shouldValidate: true });
  };

  // Get spaces that are available for selection:
  // - For add mode: spaces with no client OR spaces in current selection
  // - For edit mode: spaces with no client OR spaces already assigned to this client
  const getSelectableSpaces = () => {
    if (mode === 'add') {
      return availableSpaces.filter(s => s.clientId === null);
    }
    return availableSpaces.filter(s => s.clientId === null || s.clientId === client?.id);
  };

  const selectableSpaces = getSelectableSpaces();

  const getTitle = () => {
    switch (mode) {
      case 'add': return 'Adaugă Client';
      case 'edit': return 'Modifică Client';
      case 'delete': return 'Șterge Client';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'add': return 'Completați datele pentru noul client';
      case 'edit': return 'Modificați datele clientului';
      case 'delete': return 'Confirmați ștergerea clientului';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'add': return <Plus className="w-5 h-5" />;
      case 'edit': return <Edit className="w-5 h-5" />;
      case 'delete': return <Trash2 className="w-5 h-5" />;
    }
  };

  if (mode === 'delete') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {getTitle()}
            </DialogTitle>
            <DialogDescription>
              Sunteți sigur că doriți să ștergeți clientul <strong>{client?.name}</strong>?
              <br />
              <span className="text-destructive">Această acțiune nu poate fi anulată.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-4">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Client</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ex: CL9" 
                      {...field} 
                      disabled={mode === 'edit'}
                      className={mode === 'edit' ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Denumire</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ex: CLIENT 9" 
                      {...field} 
                      disabled={mode === 'edit'}
                      className={mode === 'edit' ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tip Persoană</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                      disabled={mode === 'edit'}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PJ" id="pj" />
                        <Label htmlFor="pj" className="cursor-pointer">Persoană Juridică (PJ)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PF" id="pf" />
                        <Label htmlFor="pf" className="cursor-pointer">Persoană Fizică (PF)</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="spaces"
              render={() => (
                <FormItem>
                  <FormLabel>Spații Ocupate</FormLabel>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                    {selectableSpaces.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nu există spații disponibile</p>
                    ) : (
                      selectableSpaces.map((space) => (
                        <div key={space.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`space-${space.id}`}
                            checked={selectedSpaces.includes(space.id)}
                            onCheckedChange={(checked) => handleSpaceToggle(space.id, checked as boolean)}
                            disabled={mode === 'edit'}
                          />
                          <Label 
                            htmlFor={`space-${space.id}`} 
                            className="cursor-pointer text-sm flex-1"
                          >
                            <span className="font-mono">{space.id}</span>
                            <span className="mx-2">-</span>
                            <span>{space.name}</span>
                            <span className="text-muted-foreground ml-2">({space.area} mp)</span>
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="persons"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Număr Persoane (Salariați)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      step="1"
                      placeholder="0" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Anulează
              </Button>
              <Button type="submit">
                {mode === 'add' ? 'Adaugă' : 'Salvează'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientForm;
