import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { suppliers } from '@/data/mockData';
import { UTILITIES } from '@/types/utility';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface RecentInvoicesProps {
  period: string;
}

const RecentInvoices = ({ period }: RecentInvoicesProps) => {
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    db.supplierInvoices.where('period').equals(period).toArray().then(setInvoices);
  }, [period]);

  const getUtilityColor = (utilityType: string) => {
    const colors: Record<string, string> = {
      EE: 'bg-chart-ee/10 text-chart-ee border-chart-ee/30',
      GN: 'bg-chart-gn/10 text-chart-gn border-chart-gn/30',
      AC: 'bg-chart-ac/10 text-chart-ac border-chart-ac/30',
      AA: 'bg-chart-aa/10 text-chart-aa border-chart-aa/30',
      SM: 'bg-chart-sm/10 text-chart-sm border-chart-sm/30',
      AS: 'bg-chart-as/10 text-chart-as border-chart-as/30',
      SSV: 'bg-chart-sm/10 text-chart-sm border-chart-sm/30',
    };
    return colors[utilityType] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="utility-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Facturi Furnizori</h3>
        <Link to="/invoices">
          <Button variant="ghost" size="sm" className="text-xs gap-1">
            Vezi toate <ExternalLink className="w-3 h-3" />
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {invoices.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nicio factură pentru această perioadă</p>
        )}
        {invoices.map((invoice) => {
          const supplier = suppliers.find(s => s.id === invoice.supplierId);
          const utility = UTILITIES.find(u => u.id === invoice.utilityType);

          return (
            <div key={invoice.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{supplier?.name || 'Furnizor'}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 ${getUtilityColor(invoice.utilityType)}`}>
                    {utility?.name}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{invoice.invoiceNumber}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{invoice.totalValue.toLocaleString('ro-RO')} lei</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(invoice.issueDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentInvoices;
