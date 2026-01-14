import { Link } from 'react-router-dom';
import { Gauge, FileText, Calculator, ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QuickActions = () => {
  const actions = [
    { 
      icon: Gauge, 
      label: 'Înregistrare Index', 
      path: '/meter-readings',
      color: 'bg-chart-ee/10 text-chart-ee hover:bg-chart-ee/20'
    },
    { 
      icon: FileText, 
      label: 'Adaugă Factură', 
      path: '/invoices',
      color: 'bg-chart-gn/10 text-chart-gn hover:bg-chart-gn/20'
    },
    { 
      icon: Calculator, 
      label: 'Repartizare', 
      path: '/distribution',
      color: 'bg-chart-ac/10 text-chart-ac hover:bg-chart-ac/20'
    },
    { 
      icon: ClipboardList, 
      label: 'Generare Notă', 
      path: '/consumption-notes',
      color: 'bg-chart-aa/10 text-chart-aa hover:bg-chart-aa/20'
    },
  ];

  return (
    <div className="utility-card">
      <h3 className="font-semibold text-foreground mb-4">Acțiuni Rapide</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link key={action.path} to={action.path}>
            <Button 
              variant="ghost" 
              className={`w-full h-auto py-4 flex-col gap-2 ${action.color} transition-all duration-200`}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
