import { useRef, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Database, 
  Shield, 
  Palette,
  Save,
  Download,
  Upload
} from 'lucide-react';
import { db } from '@/lib/db';
import { toast } from 'sonner';

const Settings = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = {
        exportDate: new Date().toISOString(),
        version: 5,
        meterReadings: await db.meterReadings.toArray(),
        distributions: await db.distributions.toArray(),
        currentMonth: await db.currentMonth.toArray(),
        supplierInvoices: await db.supplierInvoices.toArray(),
        confirmedUtilities: await db.confirmedUtilities.toArray(),
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `offgus-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup descărcat cu succes!');
    } catch (e) {
      toast.error('Eroare la exportul bazei de date!');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.meterReadings || !data.distributions) {
        throw new Error('Fișier invalid');
      }

      // Clear all tables
      await db.meterReadings.clear();
      await db.distributions.clear();
      await db.currentMonth.clear();
      await db.supplierInvoices.clear();
      await db.confirmedUtilities.clear();

      // Import data (strip auto-increment ids)
      if (data.meterReadings?.length) {
        await db.meterReadings.bulkAdd(data.meterReadings.map(({ id, ...rest }: any) => rest));
      }
      if (data.distributions?.length) {
        await db.distributions.bulkAdd(data.distributions.map(({ id, ...rest }: any) => rest));
      }
      if (data.currentMonth?.length) {
        await db.currentMonth.bulkAdd(data.currentMonth.map(({ id, ...rest }: any) => rest));
      }
      if (data.supplierInvoices?.length) {
        await db.supplierInvoices.bulkAdd(data.supplierInvoices.map(({ id, ...rest }: any) => rest));
      }
      if (data.confirmedUtilities?.length) {
        await db.confirmedUtilities.bulkAdd(data.confirmedUtilities.map(({ id, ...rest }: any) => rest));
      }

      toast.success('Baza de date a fost restaurată! Reîncărcați pagina.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error('Eroare la importul fișierului! Verificați formatul.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <MainLayout title="Setări" subtitle="Configurarea aplicației OFF-GUS">
      <div className="max-w-3xl space-y-8 animate-slide-up">
        {/* Property Settings */}
        <section className="utility-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Informații Proprietate</h2>
              <p className="text-sm text-muted-foreground">Configurarea datelor proprietății</p>
            </div>
          </div>
          
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyName">Denumire Proprietate</Label>
                <Input id="propertyName" defaultValue="Imobil Bdul Libertății" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyCode">Cod Intern</Label>
                <Input id="propertyCode" defaultValue="PROP-001" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresă</Label>
              <Input id="address" defaultValue="Bdul Libertății, nr. 80, București, Sector 2" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalArea">Suprafață Totală (mp)</Label>
                <Input id="totalArea" type="number" defaultValue="2500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalSpaces">Număr Total Spații</Label>
                <Input id="totalSpaces" type="number" defaultValue="11" />
              </div>
            </div>
          </div>
        </section>

        {/* Database Settings */}
        <section className="utility-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Baza de Date</h2>
              <p className="text-sm text-muted-foreground">Backup și restaurare date</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Export baza de date</p>
                <p className="text-sm text-muted-foreground">Descarcă toate datele ca fișier JSON</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={handleExport} disabled={isExporting}>
                <Download className="w-4 h-4" />
                {isExporting ? 'Se exportă...' : 'Descarcă Backup'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Import baza de date</p>
                <p className="text-sm text-muted-foreground">Restaurează din fișier JSON (înlocuiește datele existente)</p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? 'Se importă...' : 'Încarcă Fișier'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="utility-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-chart-gn/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-chart-gn" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Preferințe</h2>
              <p className="text-sm text-muted-foreground">Personalizare interfață</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Salvare automată</p>
                <p className="text-sm text-muted-foreground">Salvează automat modificările</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificări facturi</p>
                <p className="text-sm text-muted-foreground">Primește alerte pentru facturi noi</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Afișează TVA separat</p>
                <p className="text-sm text-muted-foreground">Arată TVA în tabele și rapoarte</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="utility-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Securitate</h2>
              <p className="text-sm text-muted-foreground">Protecția datelor</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Parolă aplicație</p>
                <p className="text-sm text-muted-foreground">Protejează accesul la aplicație</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Criptare date</p>
                <p className="text-sm text-muted-foreground">Criptează baza de date locală</p>
              </div>
              <Switch />
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button size="lg" className="gap-2">
            <Save className="w-4 h-4" />
            Salvează Setările
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
