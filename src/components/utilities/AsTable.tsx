import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Eye, Pencil } from 'lucide-react';
import { type AsSpaceRow } from '@/hooks/use-as-distribution';

interface AsTableProps {
  asData: AsSpaceRow[];
  isInitialized: boolean;
  isConfirmed: boolean;
  onDataChange?: (updatedData: AsSpaceRow[]) => void;
}

const fmt = (n: number) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 });

export default function AsTable({ asData, isInitialized, isConfirmed, onDataChange }: AsTableProps) {
  const [viewRow, setViewRow] = useState<AsSpaceRow | null>(null);
  const [editRow, setEditRow] = useState<AsSpaceRow | null>(null);
  const [editCantitate, setEditCantitate] = useState('');
  const [editNetValue, setEditNetValue] = useState('');
  const [editVatValue, setEditVatValue] = useState('');

  const totals = {
    consumReferinta: asData.reduce((s, r) => s + r.consumReferinta, 0),
    cantitateAlocata: asData.reduce((s, r) => s + r.cantitateAlocata, 0),
    valoareNeta: asData.reduce((s, r) => s + r.valoareNeta, 0),
    valoareTva: asData.reduce((s, r) => s + r.valoareTva, 0),
    total: asData.reduce((s, r) => s + r.total, 0),
  };

  const handleEdit = (row: AsSpaceRow) => {
    setEditRow(row);
    setEditCantitate(String(row.cantitateAlocata));
    setEditNetValue(String(row.valoareNeta));
    setEditVatValue(String(row.valoareTva));
  };

  const handleSaveEdit = () => {
    if (!editRow || !onDataChange) return;
    const cantitate = parseFloat(editCantitate) || 0;
    const net = parseFloat(editNetValue) || 0;
    const vat = parseFloat(editVatValue) || 0;
    const updated = asData.map(r =>
      r.spaceId === editRow.spaceId
        ? { ...r, cantitateAlocata: cantitate, valoareNeta: net, valoareTva: vat, total: net + vat }
        : r
    );
    onDataChange(updated);
    setEditRow(null);
  };

  if (!isInitialized) {
    return (
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Spațiu</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Utilitate/Serviciu</TableHead>
            <TableHead className="text-right">Consum referință</TableHead>
            <TableHead className="text-right">Cantitate alocată</TableHead>
            <TableHead className="text-right">Valoare netă</TableHead>
            <TableHead className="text-right">Valoare TVA</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[80px]">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
              Apăsați "Inițializare Consum" pentru a începe înregistrarea
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Spațiu</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Utilitate/Serviciu</TableHead>
            <TableHead className="text-right">Consum referință</TableHead>
            <TableHead className="text-right">Cantitate alocată</TableHead>
            <TableHead className="text-right">Valoare netă</TableHead>
            <TableHead className="text-right">Valoare TVA</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[80px]">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {asData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                Nu există date pentru filtrele selectate
              </TableCell>
            </TableRow>
          ) : (
            asData.map(row => (
              <TableRow key={row.spaceId} className="hover:bg-muted/50">
                <TableCell className="font-medium">{row.spaceName}</TableCell>
                <TableCell>{row.clientName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1.5 bg-chart-as/10 text-chart-as border-chart-as/30">
                    <Calculator className="w-4 h-4" />
                    AS
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {fmt(row.consumReferinta)} mc
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {fmt(row.cantitateAlocata)} mc
                </TableCell>
                <TableCell className="text-right">
                  {row.valoareNeta > 0
                    ? `${fmt(row.valoareNeta)} lei`
                    : <span className="text-muted-foreground">0,00 lei</span>
                  }
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {row.valoareTva > 0
                    ? `${fmt(row.valoareTva)} lei`
                    : '0,00 lei'
                  }
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {row.total > 0
                    ? `${fmt(row.total)} lei`
                    : <span className="text-muted-foreground">0,00 lei</span>
                  }
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewRow(row)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!isConfirmed && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(row)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {asData.length > 0 && (
          <TableFooter>
            <TableRow className="font-semibold">
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right font-mono">{fmt(totals.consumReferinta)} mc</TableCell>
              <TableCell className="text-right font-mono">{fmt(totals.cantitateAlocata)} mc</TableCell>
              <TableCell className="text-right">{fmt(totals.valoareNeta)} lei</TableCell>
              <TableCell className="text-right">{fmt(totals.valoareTva)} lei</TableCell>
              <TableCell className="text-right">{fmt(totals.total)} lei</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        )}
      </Table>

      {/* View Dialog */}
      <Dialog open={!!viewRow} onOpenChange={() => setViewRow(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalii Apă din Subteran</DialogTitle>
            <DialogDescription>{viewRow?.spaceName} — {viewRow?.clientName}</DialogDescription>
          </DialogHeader>
          {viewRow && (
            <div className="space-y-3 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Spațiu</p>
                  <p className="font-medium">{viewRow.spaceName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{viewRow.clientName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Consum referință (Alim. apă)</p>
                  <p className="font-mono font-semibold">{fmt(viewRow.consumReferinta)} mc</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cantitate alocată</p>
                  <p className="font-mono font-semibold">{fmt(viewRow.cantitateAlocata)} mc</p>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valoare netă</span>
                  <span className="font-medium">{fmt(viewRow.valoareNeta)} lei</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valoare TVA</span>
                  <span className="font-medium">{fmt(viewRow.valoareTva)} lei</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">{fmt(viewRow.total)} lei</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRow(null)}>Închide</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRow} onOpenChange={() => setEditRow(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modificare Apă din Subteran</DialogTitle>
            <DialogDescription>{editRow?.spaceName} — {editRow?.clientName}</DialogDescription>
          </DialogHeader>
          {editRow && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Consum referință (Alim. apă)</p>
                <p className="font-mono font-semibold">{fmt(editRow.consumReferinta)} mc</p>
              </div>
              <div className="space-y-2">
                <Label>Cantitate alocată (mc)</Label>
                <Input
                  type="number"
                  value={editCantitate}
                  onChange={(e) => setEditCantitate(e.target.value)}
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Valoare netă (lei)</Label>
                <Input
                  type="number"
                  value={editNetValue}
                  onChange={(e) => setEditNetValue(e.target.value)}
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Valoare TVA (lei)</Label>
                <Input
                  type="number"
                  value={editVatValue}
                  onChange={(e) => setEditVatValue(e.target.value)}
                  step="0.01"
                />
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">
                    {fmt((parseFloat(editNetValue) || 0) + (parseFloat(editVatValue) || 0))} lei
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>Anulează</Button>
            <Button onClick={handleSaveEdit}>Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
