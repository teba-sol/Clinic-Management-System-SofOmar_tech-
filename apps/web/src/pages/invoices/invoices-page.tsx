import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Receipt, Plus, Trash2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import type { Invoice, Patient } from '@/types';

export default function InvoicesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then((r) => r.data).catch(() => []),
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowCreate(false);
      toast.success('Invoice created');
    },
    onError: () => toast.error('Failed to create invoice'),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/invoices/${id}/pay`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setPayingInvoice(null);
      toast.success('Payment recorded');
    },
    onError: () => toast.error('Failed to process payment'),
  });

  if (isLoading) return <LoadingPage />;

  const pending = (invoices || []).filter((i) => i.status === 'pending');
  const paid = (invoices || []).filter((i) => i.status === 'paid');

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Manage billing and payments"
        action={
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="size-4" />
            New Invoice
          </Button>
        }
      />

      {!invoices?.length ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Create invoices for patient visits and services"
        />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pending ({pending.length})</h3>
              <div className="grid gap-3">
                {pending.map((inv) => (
                  <InvoiceCard key={inv.id} invoice={inv} onPay={setPayingInvoice} />
                ))}
              </div>
            </div>
          )}
          {paid.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Paid ({paid.length})</h3>
              <div className="grid gap-3">
                {paid.map((inv) => (
                  <InvoiceCard key={inv.id} invoice={inv} onPay={setPayingInvoice} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <CreateInvoiceForm
            patients={patients || []}
            onSubmit={(data) => createMutation.mutate(data)}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!payingInvoice} onOpenChange={() => setPayingInvoice(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          {payingInvoice && (
            <PayInvoiceForm
              invoice={payingInvoice}
              onSubmit={(data) => payMutation.mutate({ id: payingInvoice.id, data })}
              loading={payMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceCard({ invoice, onPay }: { invoice: Invoice; onPay: (inv: Invoice) => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">
              Invoice #{invoice.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-lg font-bold">${invoice.totalAmount}</p>
              {Number(invoice.amountPaid) > 0 && (
                <p className="text-xs text-muted-foreground">Paid: ${invoice.amountPaid}</p>
              )}
            </div>
            <StatusBadge status={invoice.status} />
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <Button size="sm" className="gap-1.5" onClick={() => onPay(invoice)}>
                <CreditCard className="size-3.5" />
                Pay
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateInvoiceForm({
  patients,
  onSubmit,
  loading,
}: {
  patients: Patient[];
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [patientId, setPatientId] = useState('');
  const [items, setItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    const updated = [...items];
    (updated[i] as any)[field] = field === 'quantity' || field === 'unitPrice' ? Number(value) : value;
    setItems(updated);
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ patientId, items }); }} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Patient *</Label>
        <Select value={patientId} onValueChange={(v: string | null) => setPatientId(v ?? "")}>
          <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Line Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
            <Plus className="size-3" /> Add Item
          </Button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-xl border space-y-2 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary">Item {i + 1}</span>
              {items.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} className="size-6 text-destructive">
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
            <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Qty</Label>
                <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit Price ($)</Label>
                <Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} required />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-bold text-primary">${total.toFixed(2)}</span>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading || !patientId || items.some((i) => !i.description)}>
          {loading ? 'Creating...' : 'Create Invoice'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function PayInvoiceForm({
  invoice,
  onSubmit,
  loading,
}: {
  invoice: Invoice;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [amount, setAmount] = useState(String(Number(invoice.totalAmount) - Number(invoice.amountPaid)));
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const remaining = Number(invoice.totalAmount) - Number(invoice.amountPaid);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ amount: Number(amount), paymentMethod }); }} className="space-y-4">
      <div className="p-3 rounded-xl bg-muted/50">
        <p className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">${invoice.totalAmount}</span></p>
        <p className="text-sm text-muted-foreground">Paid: <span className="font-bold text-foreground">${invoice.amountPaid}</span></p>
        <p className="text-sm font-semibold text-primary">Remaining: ${remaining.toFixed(2)}</p>
      </div>
      <div className="space-y-1.5">
        <Label>Payment Method *</Label>
        <Select value={paymentMethod} onValueChange={(v: string | null) => setPaymentMethod(v ?? "")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="telebirr">Telebirr</SelectItem>
            <SelectItem value="cbe_birr">CBE Birr</SelectItem>
            <SelectItem value="insurance">Insurance</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Amount ($) *</Label>
        <Input type="number" min={0.01} max={remaining} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading || !amount || Number(amount) <= 0}>
          {loading ? 'Processing...' : 'Record Payment'}
        </Button>
      </DialogFooter>
    </form>
  );
}
