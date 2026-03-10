import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  LayoutDashboard,
  Building2,
  Gauge,
  FileText,
  ClipboardList,
  History,
  Settings,
  Zap,
  Flame,
  Droplets,
  Thermometer,
  Trash2,
  Shield,
  Wrench,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

const Guide = () => {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ghid de Utilizare OFF-GUS</h1>
              <p className="text-sm text-muted-foreground">Gestiunea Utilităților și Serviciilor</p>
            </div>
          </div>
        </div>

        {/* Intro */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ce este OFF-GUS?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">OFF-GUS</strong> este un sistem de gestiune a utilităților și serviciilor
              pentru proprietăți cu mai mulți chiriași (persoane juridice sau fizice). Aplicația permite:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Înregistrarea indexelor de contor pentru fiecare spațiu</li>
              <li>Calculul automat al consumului pe baza formulelor specifice fiecărei utilități</li>
              <li>Înregistrarea facturilor de la furnizori</li>
              <li>Repartizarea proporțională a costurilor către chiriași</li>
              <li>Generarea notelor de consum pentru refacturare</li>
            </ul>
          </CardContent>
        </Card>

        {/* Utilities Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Utilități și Servicii Gestionate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <UtilityCard
                icon={<Zap className="w-4 h-4" />}
                code="EE"
                name="Energie Electrică"
                unit="kWh"
                type="Contor"
                description="Citire index contor. Consum = (Index Nou - Index Vechi) × Constantă"
              />
              <UtilityCard
                icon={<Flame className="w-4 h-4" />}
                code="GN"
                name="Gaze Naturale"
                unit="kWh"
                type="Contor"
                description="Citire index contor. Consum = (Index Nou - Index Vechi) × PCS (putere calorică)"
              />
              <UtilityCard
                icon={<Droplets className="w-4 h-4" />}
                code="AC"
                name="Apă & Canal"
                unit="mc"
                type="Contor"
                description="Citire index contor apă. Consum = Index Nou - Index Vechi"
              />
              <UtilityCard
                icon={<Droplets className="w-4 h-4" />}
                code="AA"
                name="Apă – Alte Asocieri"
                unit="mc"
                type="Proporțional"
                description="Repartizare proporțională pe baza numărului de persoane (Isp × Csp)"
              />
              <UtilityCard
                icon={<Thermometer className="w-4 h-4" />}
                code="AS"
                name="Apă/Servicii Sanitare"
                unit="mc"
                type="Proporțional"
                description="Repartizare proporțională pe baza numărului de persoane"
              />
              <UtilityCard
                icon={<Trash2 className="w-4 h-4" />}
                code="SM"
                name="Salubritate Menajeră"
                unit="mc"
                type="Proporțional"
                description="Repartizare proporțională pe baza suprafeței (mp)"
              />
              <UtilityCard
                icon={<Shield className="w-4 h-4" />}
                code="SSV"
                name="Servicii de Securitate/Vigilență"
                unit="mp"
                type="Proporțional"
                description="Repartizare proporțională pe baza suprafeței (mp)"
              />
              <UtilityCard
                icon={<Wrench className="w-4 h-4" />}
                code="SC"
                name="Servicii Curățenie"
                unit="mp"
                type="Proporțional"
                description="Repartizare proporțională pe baza suprafeței (mp)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Step by Step Workflow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fluxul Lunar de Lucru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground mb-4">
              Urmați acești pași în ordine pentru a finaliza o lună de consum:
            </p>
            <Accordion type="multiple" className="w-full">
              <WorkflowStep
                value="step1"
                step="1"
                title="Verificare Spații & Clienți"
                icon={<Building2 className="w-4 h-4" />}
              >
                <p>
                  Accesați <strong>Spații & Clienți</strong> din meniu. Verificați că toate spațiile ocupate
                  au un chiriaș asociat și că datele (suprafață, nr. persoane, racorduri) sunt corecte.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Spațiile fără chiriaș nu sunt incluse în repartizare</li>
                  <li>Suprafața (mp) este folosită pentru SM, SSV, SC</li>
                  <li>Nr. persoane este folosit pentru AA, AS</li>
                </ul>
              </WorkflowStep>

              <WorkflowStep
                value="step2"
                step="2"
                title="Înregistrare Facturi Furnizori"
                icon={<FileText className="w-4 h-4" />}
              >
                <p>
                  Accesați <strong>Facturi Furnizori</strong> și adăugați facturile primite de la furnizori
                  pentru luna curentă. Fiecare factură conține:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Furnizor</strong> – selectat din lista predefinită</li>
                  <li><strong>Tip utilitate</strong> – EE, GN, AC, etc.</li>
                  <li><strong>Perioada</strong> – luna aferentă</li>
                  <li><strong>Valori financiare</strong> – Valoare Netă, TVA, Total</li>
                </ul>
                <div className="mt-2 p-2 bg-accent/50 rounded-md flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs">Facturile sunt necesare pentru calculul valorilor financiare repartizate.</span>
                </div>
              </WorkflowStep>

              <WorkflowStep
                value="step3"
                step="3"
                title="Luna de Consum – Inițializare"
                icon={<Gauge className="w-4 h-4" />}
              >
                <p>
                  Accesați <strong>Utilități/Servicii → Luna de Consum</strong>. Selectați perioada dorită
                  și apăsați <strong>Inițializare Consum</strong>.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Sistemul creează automat o linie pentru fiecare spațiu ocupat × utilitate</li>
                  <li>Pentru utilitățile cu contor, „Index Vechi" este preluat automat din ultima citire</li>
                  <li>Pentru servicii (AA, AS, SM, SSV, SC), se precompletează Isp (indice spațial)</li>
                </ul>
              </WorkflowStep>

              <WorkflowStep
                value="step4"
                step="4"
                title="Completare Indexe și Consum"
                icon={<Gauge className="w-4 h-4" />}
              >
                <p>
                  După inițializare, completați datele pentru fiecare utilitate:
                </p>
                <div className="mt-2 space-y-2">
                  <div className="p-2 border border-border rounded-md">
                    <p className="font-medium text-xs text-foreground">Utilități cu contor (EE, GN, AC):</p>
                    <p className="text-xs mt-1">Introduceți <strong>Index Nou</strong> pentru fiecare spațiu. Consumul se calculează automat.</p>
                  </div>
                  <div className="p-2 border border-border rounded-md">
                    <p className="font-medium text-xs text-foreground">Servicii proporționale (AA, AS, SM, SSV, SC):</p>
                    <p className="text-xs mt-1">Verificați <strong>Isp</strong> (indice spațial) și introduceți <strong>Csp</strong> (cost specific) pentru repartizare.</p>
                  </div>
                </div>
              </WorkflowStep>

              <WorkflowStep
                value="step5"
                step="5"
                title="Confirmare Individuală per Utilitate"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                <p>
                  După completarea datelor, confirmați fiecare utilitate individual folosind badge-urile
                  din partea de sus a secțiunii Luna de Consum.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Badge-ul devine <span className="text-green-500 font-medium">verde (✓)</span> după confirmare</li>
                  <li>Confirmarea salvează starea în baza de date (persistentă)</li>
                  <li>Puteți redeschide o utilitate confirmată pentru corecții</li>
                </ul>
                <div className="mt-2 p-2 bg-destructive/10 rounded-md flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-xs">Utilitățile cu contor care au Index Nou = 0 vor bloca confirmarea!</span>
                </div>
              </WorkflowStep>

              <WorkflowStep
                value="step6"
                step="6"
                title="Închidere Lună de Consum"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                <p>
                  După confirmarea tuturor utilităților active, butonul <strong>Închidere Lună de Consum</strong>
                  devine activ. Apăsați pentru a finaliza luna.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Butonul afișează progresul: (confirmate/total)</li>
                  <li>Datele sunt transferate în istoricul de distribuții</li>
                  <li>Citirile contoarelor sunt salvate ca referință pentru luna următoare</li>
                  <li>Perioada curentă avansează automat la luna următoare</li>
                </ul>
              </WorkflowStep>

              <WorkflowStep
                value="step7"
                step="7"
                title="Generare Note de Consum"
                icon={<ClipboardList className="w-4 h-4" />}
              >
                <p>
                  Accesați <strong>Note de Consum</strong> pentru a genera documentele de refacturare
                  către chiriași. Fiecare notă conține:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Detaliile chiriașului și spațiului</li>
                  <li>Breakdown pe utilități: consum, valoare netă, TVA, total</li>
                  <li>Totalul general de plată</li>
                </ul>
              </WorkflowStep>
            </Accordion>
          </CardContent>
        </Card>

        {/* Module Descriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Descrierea Modulelor</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="dashboard">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-primary" />
                    Dashboard
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2">
                  <p>Panoul principal oferă o vedere de ansamblu asupra activității:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Statistici rapide</strong> – total spații, chiriași activi, facturi, consum</li>
                    <li><strong>Grafice de consum</strong> – evoluția consumului pe utilități</li>
                    <li><strong>Acțiuni rapide</strong> – scurtături către funcțiile frecvente</li>
                    <li><strong>Facturi recente</strong> – ultimele facturi înregistrate</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="spaces">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Spații & Clienți
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2">
                  <p>Administrarea spațiilor și a chiriașilor:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Spații</strong> – definirea spațiilor cu suprafață, persoane, racorduri (EE, GN, AA)</li>
                    <li><strong>Clienți</strong> – evidența chiriașilor (PJ/PF) și asocierea la spații</li>
                    <li>Un spațiu poate avea un singur chiriaș; un chiriaș poate ocupa mai multe spații</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="utilities">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-primary" />
                    Utilități/Servicii
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2">
                  <p>Modulul central cu două secțiuni:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Istoric de Consum</strong> – vizualizare read-only a datelor din perioadele închise</li>
                    <li><strong>Luna de Consum</strong> – spațiul de lucru activ pentru înregistrarea consumurilor și repartizarea valorilor</li>
                  </ul>
                  <p className="mt-2">Selectorul de perioadă afișează doar luna curentă și luna anterioară. Perioadele deja arhivate sunt excluse automat.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="invoices">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Facturi Furnizori
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2">
                  <p>Evidența facturilor primite de la furnizorii de utilități:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Fiecare factură este asociată unui tip de utilitate și unei perioade</li>
                    <li>Valorile din facturi (Net, TVA, Total) sunt folosite la repartizarea proporțională</li>
                    <li>O singură factură per utilitate per perioadă</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="history">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Istoric
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2">
                  <p>Arhiva cu toate perioadele închise:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Vizualizare detaliată pe perioadă și utilitate</li>
                    <li>Posibilitatea de a șterge o perioadă arhivată pentru reinițializare</li>
                    <li>Datele din istoric nu pot fi modificate direct</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Formulas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Formule de Calcul</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-3">
              <FormulaRow
                title="Energie Electrică (EE)"
                formula="Consum = (Index Nou − Index Vechi) × Constantă"
                note="Constantă implicită = 1 (pentru contoare directe)"
              />
              <Separator />
              <FormulaRow
                title="Gaze Naturale (GN)"
                formula="Consum (kWh) = (Index Nou − Index Vechi) × PCS"
                note="PCS = Putere Calorică Superioară (implicit 10.94 kWh/mc)"
              />
              <Separator />
              <FormulaRow
                title="Apă & Canal (AC)"
                formula="Consum = Index Nou − Index Vechi"
                note="Unitate de măsură: mc (metri cubi)"
              />
              <Separator />
              <FormulaRow
                title="Servicii Proporționale (AA, AS, SM, SSV, SC)"
                formula="Consum Alocat = Isp × Csp"
                note="Isp = Indice Spațial (suprafață sau nr. persoane); Csp = Cost Specific Proporțional"
              />
              <Separator />
              <FormulaRow
                title="Repartizare Valoare Financiară"
                formula="Valoare Spațiu = (Consum Spațiu / Total Consum Utilitate) × Valoare Factură"
                note="Se aplică proporțional pentru Net, TVA și Total"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sfaturi și Bune Practici</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>Înregistrați facturile furnizorilor <strong>înainte</strong> de a completa consumurile în Luna de Consum.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>Verificați că toate spațiile ocupate au racordurile corecte definite (EE, GN, AA).</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>Confirmați utilitățile pe rând pentru a avea control complet asupra datelor.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>Puteți redeschide o utilitate confirmată pentru corecții, atâta timp cât luna nu a fost închisă.</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p>Odată ce luna este închisă, datele sunt transferate în istoric și nu mai pot fi modificate direct.</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p>Dacă trebuie să corectați o perioadă arhivată, o puteți șterge din Istoric și reinițializa.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

// Sub-components

const UtilityCard = ({
  icon,
  code,
  name,
  unit,
  type,
  description,
}: {
  icon: React.ReactNode;
  code: string;
  name: string;
  unit: string;
  type: string;
  description: string;
}) => (
  <div className="p-3 border border-border rounded-lg space-y-1.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-sm text-foreground">{name}</span>
      </div>
      <Badge variant="outline" className="text-[10px]">{code}</Badge>
    </div>
    <div className="flex gap-2">
      <Badge variant="secondary" className="text-[10px]">{unit}</Badge>
      <Badge variant={type === 'Contor' ? 'default' : 'outline'} className="text-[10px]">{type}</Badge>
    </div>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

const WorkflowStep = ({
  value,
  step,
  title,
  icon,
  children,
}: {
  value: string;
  step: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <AccordionItem value={value}>
    <AccordionTrigger className="text-sm">
      <span className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
          {step}
        </span>
        {icon}
        {title}
      </span>
    </AccordionTrigger>
    <AccordionContent className="text-sm text-muted-foreground pl-8">
      {children}
    </AccordionContent>
  </AccordionItem>
);

const FormulaRow = ({
  title,
  formula,
  note,
}: {
  title: string;
  formula: string;
  note: string;
}) => (
  <div className="space-y-1">
    <p className="font-medium text-foreground">{title}</p>
    <code className="block bg-muted px-3 py-2 rounded-md text-xs font-mono">{formula}</code>
    <p className="text-xs text-muted-foreground">{note}</p>
  </div>
);

export default Guide;
