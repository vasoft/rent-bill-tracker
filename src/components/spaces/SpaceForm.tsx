import { useEffect } from 'react';
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
import { Space } from '@/types/utility';
import { toast } from '@/components/ui/use-toast';
import { AlertTriangle } from 'lucide-react';

const spaceSchema = z.object({
  id: z.string().min(1, 'ID-ul este obligatoriu').max(10, 'ID-ul trebuie să aibă maxim 10 caractere'),
  name: z.string().min(1, 'Denumirea este obligatorie').max(50, 'Denumirea trebuie să aibă maxim 50 caractere'),
  area: z.coerce.number().min(0.01, 'Suprafața trebuie să fie mai mare de 0'),
  persons: z.coerce.number().min(0, 'Numărul de persoane nu poate fi negativ').int('Numărul de persoane trebuie să fie întreg'),
});

type SpaceFormValues = z.infer<typeof spaceSchema>;

interface SpaceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit' | 'delete';
  space?: Space | null;
  existingIds: string[];
  onSubmit: (data: SpaceFormValues, mode: 'add' | 'edit' | 'delete') => void;
}

export const SpaceForm = ({
  open,
  onOpenChange,
  mode,
  space,
  existingIds,
  onSubmit,
}: SpaceFormProps) => {
  const form = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      id: '',
      name: '',
      area: 0,
      persons: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === 'add') {
        form.reset({
          id: '',
          name: '',
          area: 0,
          persons: 0,
        });
      } else if (space) {
        form.reset({
          id: space.id,
          name: space.name,
          area: space.area,
          persons: space.persons,
        });
      }
    }
  }, [open, mode, space, form]);

  const handleSubmit = (values: SpaceFormValues) => {
    // Check for duplicate ID on add
    if (mode === 'add' && existingIds.includes(values.id)) {
      form.setError('id', { message: 'Acest ID există deja' });
      return;
    }
    
    // Check for duplicate ID on edit (if changed)
    if (mode === 'edit' && space && values.id !== space.id && existingIds.includes(values.id)) {
      form.setError('id', { message: 'Acest ID există deja' });
      return;
    }

    onSubmit(values, mode);
    onOpenChange(false);
    
    const messages = {
      add: 'Spațiul a fost adăugat cu succes',
      edit: 'Spațiul a fost modificat cu succes',
      delete: 'Spațiul a fost șters cu succes',
    };
    
    toast({
      title: 'Succes',
      description: messages[mode],
    });
  };

  const handleDelete = () => {
    if (space) {
      onSubmit({ id: space.id, name: space.name, area: space.area, persons: space.persons }, 'delete');
      onOpenChange(false);
      toast({
        title: 'Succes',
        description: 'Spațiul a fost șters cu succes',
      });
    }
  };

  const titles = {
    add: 'Adaugă Spațiu Nou',
    edit: 'Modifică Spațiu',
    delete: 'Ștergere Spațiu',
  };

  const descriptions = {
    add: 'Completați informațiile pentru noul spațiu',
    edit: 'Modificați informațiile spațiului',
    delete: 'Confirmați ștergerea spațiului',
  };

  if (mode === 'delete') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {titles.delete}
            </DialogTitle>
            <DialogDescription>
              Sunteți sigur că doriți să ștergeți acest spațiu? Această acțiune nu poate fi anulată.
            </DialogDescription>
          </DialogHeader>
          
          {space && (
            <div className="space-y-3 py-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-medium">{space.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Denumire:</span>
                <span className="font-medium">{space.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Suprafață:</span>
                <span className="font-medium">{space.area.toLocaleString('ro-RO')} mp</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Persoane:</span>
                <span className="font-medium">{space.persons}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Șterge Spațiu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[mode]}</DialogTitle>
          <DialogDescription>{descriptions[mode]}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Spațiu</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: P1, E2" 
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
                    <Input placeholder="Ex: Parter-NordEst1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suprafață (mp)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="persons"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persoane</FormLabel>
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
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Anulează
              </Button>
              <Button type="submit">
                {mode === 'add' ? 'Adaugă Spațiu' : 'Salvează Modificările'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
