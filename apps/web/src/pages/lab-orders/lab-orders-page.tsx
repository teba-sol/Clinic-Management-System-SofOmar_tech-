import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FlaskConical, Plus, Beaker, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { LabOrder, Patient } from '@/types';

export default function LabOrdersPage() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<LabOrder | null>(null);
  const queryClient = useQueryClient();

  const { data: labOrders, isLoading } = useQuery<LabOrder[]>({
    queryKey: ['lab-orders'],
    queryFn: () => {
      if (user?.role === 'lab_tech') {
        return api.get('/lab-orders/pending').then((r) => r.data);
      }
      return api.get('/lab-orders').then((r) => r.data).catch(() => []);
    },
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/lab-orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
      setShowCreate(false);
      toast.success('Lab order placed');
    },
    onError: () => toast.error('Failed to place lab order'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/lab-orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
      setUpdatingOrder(null);
      toast.success('Lab order updated');
    },
    onError: () => toast.error('Failed to update lab order'),
  });

  if (isLoading) return <LoadingPage />;

  const pending = (labOrders || []).filter((o) => o.status === 'ordered');
  const inProgress = (labOrders || []).filter((o) => ['sample_collected', 'in_progress'].includes(o.status));
  const completed = (labOrders || []).filter((o) => o.status === 'completed');

  return (
    <div>
      <PageHeader
        title="Lab Orders"
        description="Order and track laboratory tests"
        action={
          user?.role === 'doctor' ? (
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="size-4" />
              Order Lab Test
            </Button>
          ) : undefined
        }
      />

      {!labOrders?.length ? (
        <EmptyState
          icon={FlaskConical}
          title="No lab orders"
          description="Lab orders placed by doctors will appear here"
        />
      ) : (
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="gap-1.5">
              <Beaker className="size-3.5" />
              Pending ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="gap-1.5">
              In Progress ({inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              <CheckCircle2 className="size-3.5" />
              Completed ({completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <LabOrderList orders={pending} onUpdate={setUpdatingOrder} />
          </TabsContent>
          <TabsContent value="in-progress">
            <LabOrderList orders={inProgress} onUpdate={setUpdatingOrder} />
          </TabsContent>
          <TabsContent value="completed">
            <LabOrderList orders={completed} onUpdate={setUpdatingOrder} />
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Lab Test</DialogTitle>
          </DialogHeader>
          <CreateLabOrderForm
            patients={patients || []}
            doctorId={user?.id || ''}
            onSubmit={(data) => createMutation.mutate(data)}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!updatingOrder} onOpenChange={() => setUpdatingOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Lab Order</DialogTitle>
          </DialogHeader>
          {updatingOrder && (
            <UpdateLabOrderForm
              order={updatingOrder}
              onSubmit={(data) => updateMutation.mutate({ id: updatingOrder.id, data })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LabOrderList({
  orders,
  onUpdate,
}: {
  orders: LabOrder[];
  onUpdate: (order: LabOrder) => void;
}) {
  if (!orders.length) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">No orders in this category</div>
    );
  }

  return (
    <div className="grid gap-3">
      {orders.map((order) => (
        <Card key={order.id} className="hover:shadow-md transition-shadow">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{order.testType}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ordered: {new Date(order.createdAt).toLocaleDateString()}
                </p>
                {order.resultText && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Result: {order.resultText}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={order.status} />
                <Button variant="outline" size="sm" onClick={() => onUpdate(order)}>
                  Update
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CreateLabOrderForm({
  patients,
  doctorId,
  onSubmit,
  loading,
}: {
  patients: Patient[];
  doctorId: string;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [patientId, setPatientId] = useState('');
  const [testType, setTestType] = useState('');

  return (
      <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); onSubmit({ patientId, orderedByDoctorId: doctorId, testType, visitId: '00000000-0000-0000-0000-000000000000' }); }} className="space-y-4">
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
      <div className="space-y-1.5">
        <Label>Test Type *</Label>
        <Input value={testType} onChange={(e) => setTestType(e.target.value)} placeholder="e.g. Complete Blood Count" required />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading || !patientId || !testType}>
          {loading ? 'Ordering...' : 'Place Order'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function UpdateLabOrderForm({
  order,
  onSubmit,
  loading,
}: {
  order: LabOrder;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [status, setStatus] = useState(order.status);
  const [resultText, setResultText] = useState(order.resultText || '');

  return (
      <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); onSubmit({ status, resultText: resultText || undefined }); }} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Status *</Label>
        <Select value={status} onValueChange={(v: string | null) => { if (v) setStatus(v as typeof status); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="sample_collected">Sample Collected</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Result</Label>
        <Textarea value={resultText} onChange={(e) => setResultText(e.target.value)} placeholder="Enter test results..." rows={4} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Order'}
        </Button>
      </DialogFooter>
    </form>
  );
}
