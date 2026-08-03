import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { SearchSelect } from '@/components/shared/search-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Receipt, Plus, Trash2, CreditCard, Printer, Eye, Sparkles, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { Invoice, Patient, Service } from '@/types';

export default function InvoicesPage() {
  const [searchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [preselectedPatientId, setPreselectedPatientId] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const pid = searchParams.get('patientId');
    if (pid) {
      setPreselectedPatientId(pid);
      setShowCreate(true);
    }
  }, [searchParams]);

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then((r) => r.data).catch(() => []),
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data).catch(() => []),
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
  const partial = (invoices || []).filter((i) => i.status === 'partial');
  const paid = (invoices || []).filter((i) => i.status === 'paid');

  const renderGroup = (group: Invoice[], title: string) =>
    group.length > 0 && (
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title} ({group.length})</h3>
        <div className="grid gap-3">
          {group.map((inv) => (
            <InvoiceCard key={inv.id} invoice={inv} onPay={setPayingInvoice} onView={setViewingInvoice} />
          ))}
        </div>
      </div>
    );

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
          {renderGroup(pending, 'Pending')}
          {renderGroup(partial, 'Partially Paid')}
          {renderGroup(paid, 'Paid')}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <CreateInvoiceForm
            patients={patients || []}
            preselectedPatientId={preselectedPatientId}
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

      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {viewingInvoice && <InvoiceDetailView invoice={viewingInvoice} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceCard({ invoice, onPay, onView }: { invoice: Invoice; onPay: (inv: Invoice) => void; onView: (inv: Invoice) => void }) {
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
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-lg font-bold">${invoice.totalAmount}</p>
              {Number(invoice.amountPaid) > 0 && (
                <p className="text-xs text-muted-foreground">Paid: ${invoice.amountPaid}</p>
              )}
              {invoice.status === 'partial' && (
                <p className="text-xs text-amber-600 font-medium">
                  Remaining: ${(Number(invoice.totalAmount) - Number(invoice.amountPaid)).toFixed(2)}
                </p>
              )}
            </div>
            <StatusBadge status={invoice.status} />
            <Button size="sm" variant="ghost" onClick={() => onView(invoice)} title="View details">
              <Eye className="size-3.5" />
            </Button>
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
  preselectedPatientId,
  onSubmit,
  loading,
}: {
  patients: Patient[];
  preselectedPatientId?: string;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const { data: services } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => api.get('/services/active').then((r) => r.data).catch(() => []),
  });

  const [patientId, setPatientId] = useState(preselectedPatientId || '');
  const [visitId, setVisitId] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<{ serviceId: string | null; description: string; quantity: number; unitPrice: number }[]>([
    { serviceId: null, description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (preselectedPatientId && preselectedPatientId !== patientId) {
      setPatientId(preselectedPatientId);
    }
  }, [preselectedPatientId]);

  useEffect(() => {
    if (patientId && items.length === 1 && !items[0].description) {
      loadSuggestions();
    }
  }, [patientId]);

  const loadSuggestions = async () => {
    if (!patientId) return;
    setLoadingSuggestions(true);
    try {
      const data = await api.get(`/invoices/auto-fill/${patientId}`).then((r) => r.data);
      if (data.items && data.items.length > 0) {
        setItems(data.items.map((i: any) => ({ serviceId: i.serviceId ?? null, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })));
        setVisitId(data.visitId ?? undefined);
        toast.success(`Loaded ${data.items.length} item(s) from visit${data.hasVisit ? '' : ' (no recent visit)'}`);
      } else {
        toast('No suggestions found for this patient');
      }
    } catch {
      toast.error('Failed to load suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addItem = () => setItems([...items, { serviceId: null, description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    const updated = [...items];
    (updated[i] as any)[field] = field === 'quantity' || field === 'unitPrice' ? Number(value) : value;
    setItems(updated);
  };
  const selectService = (i: number, serviceId: string | null) => {
    const updated = [...items];
    if (!serviceId) {
      updated[i].serviceId = null;
      setItems(updated);
      return;
    }
    const svc = services?.find((s) => s.id === serviceId);
    if (!svc) return;
    updated[i].serviceId = svc.id;
    updated[i].description = svc.name;
    updated[i].unitPrice = Number(svc.defaultPrice);
    setItems(updated);
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ patientId, visitId, items }); }} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Patient *</Label>
        <SearchSelect
          items={patients.map((p) => ({
            value: p.id,
            label: `${p.firstName} ${p.lastName}`,
            subtitle: p.mrn,
          }))}
          value={patientId}
          onValueChange={setPatientId}
          placeholder="Select patient"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Line Items</Label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={loadSuggestions} disabled={!patientId || loadingSuggestions} className="gap-1">
              <Sparkles className={loadingSuggestions ? 'size-3 animate-spin' : 'size-3'} />
              {loadingSuggestions ? 'Loading...' : 'Auto-Fill'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
              <Plus className="size-3" /> Add Item
            </Button>
          </div>
        </div>
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-xl border space-y-2 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary">Item {i + 1}</span>
              <div className="flex items-center gap-1">
                {item.serviceId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => selectService(i, null)}
                    className="h-6 px-2 text-xs text-muted-foreground"
                  >
                    Custom item
                  </Button>
                )}
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} className="size-6 text-destructive">
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Service</Label>
              <SearchSelect
                items={[
                  { value: 'custom', label: 'Custom item (free text)', subtitle: 'Set your own description and price' },
                  ...(services || []).map((s) => ({
                    value: s.id,
                    label: s.name,
                    subtitle: `$${s.defaultPrice} — ${s.category}`,
                  })),
                ]}
                value={item.serviceId ?? ''}
                onValueChange={(v: string | null) => selectService(i, v === 'custom' ? null : (v ?? null))}
                placeholder="Select a service"
              />
            </div>
            <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} required disabled={!!item.serviceId} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Qty</Label>
                <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit Price ($)</Label>
                <Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} required disabled={!!item.serviceId} />
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

function InvoiceDetailView({ invoice }: { invoice: Invoice }) {
  const { data: detail, isFetching } = useQuery<any>({
    queryKey: ['invoice', invoice.id],
    queryFn: () => api.get(`/invoices/${invoice.id}`).then((r) => r.data),
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head>
        <title>Invoice ${invoice.id.slice(0, 8).toUpperCase()}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; color: #000; }
          .receipt { max-width: 300px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 16px; border-bottom: 1px dashed #000; padding-bottom: 12px; }
          .header h1 { font-size: 16px; margin: 0 0 4px; }
          .header p { margin: 2px 0; font-size: 11px; color: #555; }
          .items { width: 100%; margin: 12px 0; border-collapse: collapse; }
          .items th { text-align: left; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #000; padding: 4px 0; }
          .items td { padding: 4px 0; font-size: 11px; }
          .items td:last-child { text-align: right; }
          .total { border-top: 2px solid #000; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 16px; border-top: 1px dashed #000; padding-top: 12px; font-size: 10px; color: #555; }
          .status { text-align: center; margin: 8px 0; font-size: 13px; font-weight: bold; text-transform: uppercase; }
          .patient-info { margin: 8px 0; font-size: 11px; }
          .patient-info p { margin: 2px 0; }
          .payment-info { margin: 8px 0; font-size: 11px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>SofOmar Clinic</h1>
            <p>Payment Receipt</p>
            <p>${new Date(invoice.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>
          <p style="font-size:10px;color:#555;">Invoice #${invoice.id.slice(0, 8).toUpperCase()}</p>
          <table class="items">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              ${(detail?.items || []).map((item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${Number(item.unitPrice).toFixed(2)}</td>
                  <td>$${(item.quantity * Number(item.unitPrice)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total"><span>Total</span><span>$${invoice.totalAmount}</span></div>
          ${Number(invoice.amountPaid) > 0 ? `
            <div class="payment-info">
              <p>Paid: $${invoice.amountPaid}</p>
              <p>Method: ${(invoice.paymentMethod || 'N/A').replace('_', ' ')}</p>
            </div>
          ` : ''}
          <div class="status" style="color:${invoice.status === 'paid' ? '#16a34a' : '#d97706'}">${invoice.status.replace('_', ' ')}</div>
          <div class="footer">
            <p>Thank you for your visit!</p>
            <p>SofOmar Clinic Management System</p>
          </div>
        </div>
        <script>window.print();window.close();<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintClaim = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const patient = detail?.patient;
    const due = (Number(invoice.totalAmount) - Number(invoice.amountPaid)).toFixed(2);
    printWindow.document.write(`
      <html>
      <head>
        <title>Claim Invoice ${invoice.id.slice(0, 8).toUpperCase()}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; margin: 0; padding: 24px; color: #111; }
          .page { max-width: 720px; margin: 0 auto; }
          .letterhead { border-bottom: 3px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px; }
          .letterhead h1 { margin: 0; font-size: 22px; color: #0f766e; letter-spacing: 0.5px; }
          .letterhead p { margin: 2px 0; font-size: 11px; color: #555; }
          .title-bar { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
          .title-bar h2 { margin: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #0f766e; }
          .title-bar p { margin: 0; font-size: 11px; color: #555; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
          .box { border: 1px solid #ddd; border-radius: 6px; padding: 10px 12px; }
          .box h3 { margin: 0 0 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
          .box p { margin: 2px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; background: #f0fdfa; color: #0f766e; border: 1px solid #ddd; padding: 6px 8px; }
          td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
          td.right, th.right { text-align: right; }
          .totals { margin-left: auto; width: 260px; }
          .totals td { border: none; padding: 3px 8px; }
          .totals .grand { font-weight: bold; font-size: 14px; border-top: 2px solid #0f766e; }
          .payment { margin: 12px 0; padding: 10px 12px; border-radius: 6px; font-size: 12px; }
          .payment.paid { background: #ecfdf5; border: 1px solid #10b981; }
          .payment.due { background: #fffbeb; border: 1px solid #f59e0b; }
          .signatures { display: flex; justify-content: space-between; margin-top: 48px; }
          .signatures .sig { width: 40%; }
          .signatures .sig p { margin: 0 0 40px; font-size: 11px; color: #555; border-bottom: 1px solid #999; padding-bottom: 4px; }
          .footer { margin-top: 32px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; color: #777; text-align: center; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="letterhead">
            <h1>${import.meta.env.VITE_CLINIC_NAME || 'SofOmar Clinic'}</h1>
            <p>${import.meta.env.VITE_CLINIC_ADDRESS || ''}</p>
            <p>Tel: ${import.meta.env.VITE_CLINIC_PHONE || ''}</p>
          </div>
          <div class="title-bar">
            <h2>Medical Claim Invoice</h2>
            <p>Issue date: ${new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>
          <div class="meta">
            <div class="box">
              <h3>Bill To</h3>
              <p><strong>${patient ? patient.firstName + ' ' + patient.lastName : 'N/A'}</strong></p>
              <p>MRN: ${patient?.mrn ?? 'N/A'}</p>
              <p>${patient?.phone ? 'Phone: ' + patient.phone : ''}</p>
              <p>${patient?.gender ? 'Gender: ' + patient.gender : ''}</p>
            </div>
            <div class="box">
              <h3>Invoice Details</h3>
              <p>Invoice No: ${invoice.id.slice(0, 8).toUpperCase()}</p>
              <p>Status: ${invoice.status.toUpperCase()}</p>
              <p>Payment: ${(invoice.paymentMethod || 'N/A').replace('_', ' ')}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th class="right">Qty</th>
                <th class="right">Unit Price</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(detail?.items || []).map((item: any, i: number) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.description}</td>
                  <td class="right">${item.quantity}</td>
                  <td class="right">$${Number(item.unitPrice).toFixed(2)}</td>
                  <td class="right">$${(item.quantity * Number(item.unitPrice)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <table class="totals">
            <tr><td>Subtotal</td><td class="right">$${invoice.totalAmount}</td></tr>
            <tr><td>Amount Paid</td><td class="right">$${invoice.amountPaid}</td></tr>
            <tr class="grand"><td>${Number(invoice.amountPaid) >= Number(invoice.totalAmount) ? 'Total Paid' : 'Balance Due'}</td><td class="right">$${Number(invoice.amountPaid) >= Number(invoice.totalAmount) ? invoice.totalAmount : due}</td></tr>
          </table>
          <div class="payment ${Number(invoice.amountPaid) >= Number(invoice.totalAmount) ? 'paid' : 'due'}">
            <strong>${Number(invoice.amountPaid) >= Number(invoice.totalAmount) ? 'PAID IN FULL' : 'AMOUNT DUE: $' + due}</strong> — ${
              Number(invoice.amountPaid) >= Number(invoice.totalAmount) ? 'Received via ' + (invoice.paymentMethod || 'N/A').replace('_', ' ') + ' on ' + new Date(invoice.updatedAt || invoice.createdAt).toLocaleDateString() : 'Please settle the balance above.'
            }
          </div>
          <div class="signatures">
            <div class="sig">
              <p>Prepared By</p>
              <p>Signature / Stamp</p>
            </div>
            <div class="sig">
              <p>Approved By</p>
              <p>Signature / Stamp</p>
            </div>
          </div>
          <div class="footer">
            <p>This is a computer-generated claim invoice. For billing inquiries, contact ${import.meta.env.VITE_CLINIC_PHONE || 'the clinic'}.</p>
            <p>${import.meta.env.VITE_CLINIC_NAME || 'SofOmar Clinic'} — Clinic Management System</p>
          </div>
        </div>
        <script>window.print();window.close();<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isFetching) return <div className="text-sm text-muted-foreground text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Invoice #{invoice.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs text-muted-foreground">{new Date(invoice.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium">Description</th>
              <th className="text-right p-3 font-medium">Qty</th>
              <th className="text-right p-3 font-medium">Price</th>
              <th className="text-right p-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {(detail?.items || []).map((item: any, i: number) => (
              <tr key={item.id || i} className="border-t">
                <td className="p-3">{item.description}</td>
                <td className="p-3 text-right">{item.quantity}</td>
                <td className="p-3 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                <td className="p-3 text-right font-medium">${(item.quantity * Number(item.unitPrice)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-bold">${invoice.totalAmount}</span>
      </div>

      {Number(invoice.amountPaid) > 0 && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-xs text-muted-foreground">Amount Paid</p>
            <p className="font-semibold text-emerald-700">$${invoice.amountPaid}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-xs text-muted-foreground">Payment Method</p>
            <p className="font-semibold capitalize">{(invoice.paymentMethod || 'N/A').replace('_', ' ')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button onClick={handlePrintClaim} variant="outline" className="gap-2">
          <FileText className="size-4" />
          Print Claim Invoice
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="size-4" />
          Print Receipt
        </Button>
      </div>
    </div>
  );
}
