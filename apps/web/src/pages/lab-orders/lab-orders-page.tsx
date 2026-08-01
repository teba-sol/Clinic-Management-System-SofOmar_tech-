import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { usePatientContext } from '@/context/patient-context';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchSelect } from '@/components/shared/search-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FlaskConical, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { LabOrder, LabOrderStatus, Patient } from '@/types';

export default function LabOrdersPage() {
  const { user } = useAuth();
  const { patient: contextPatient } = usePatientContext();
  const [showCreate, setShowCreate] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<LabOrder | null>(null);
  const queryClient = useQueryClient();

  const { data: labOrders, isLoading } = useQuery<LabOrder[]>({
    queryKey: ['lab-orders'],
    queryFn: () => api.get('/lab-orders').then((r) => r.data).catch(() => []),
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
      toast.success('Lab order created');
    },
    onError: () => toast.error('Failed to create lab order'),
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

  const pending = (labOrders || []).filter((o) => o.status === 'ordered' || o.status === 'sample_collected');
  const inProgress = (labOrders || []).filter((o) => o.status === 'in_progress');
  const completed = (labOrders || []).filter((o) => o.status === 'completed');

  if (isLoading) return <LoadingPage />;

  return (
    <div>
      <PageHeader
        title="Lab Orders"
        description="Manage laboratory test orders and results"
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
          title="No lab orders yet"
          description="Order lab tests during patient visits"
        />
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress ({inProgress.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {pending.map((order) => (
              <LabOrderCard key={order.id} order={order} onUpdate={setUpdatingOrder} user={user} />
            ))}
            {pending.length === 0 && <EmptyState icon={FlaskConical} title="No pending orders" />}
          </TabsContent>

          <TabsContent value="in-progress" className="mt-4 space-y-3">
            {inProgress.map((order) => (
              <LabOrderCard key={order.id} order={order} onUpdate={setUpdatingOrder} user={user} />
            ))}
            {inProgress.length === 0 && <EmptyState icon={FlaskConical} title="No in-progress orders" />}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-3">
            {completed.map((order) => (
              <LabOrderCard key={order.id} order={order} onUpdate={setUpdatingOrder} user={user} />
            ))}
            {completed.length === 0 && <EmptyState icon={FlaskConical} title="No completed orders" />}
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
            defaultPatientId={contextPatient?.id || ''}
            onSubmit={(data) => createMutation.mutate(data)}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!updatingOrder} onOpenChange={(o) => !o && setUpdatingOrder(null)}>
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

function LabOrderCard({ order, onUpdate, user }: { order: LabOrder; onUpdate: (o: LabOrder) => void; user: any }) {
  const canUpdate = user?.role === 'lab_tech' || user?.role === 'admin';
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold">{order.testType}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
            {order.resultText && <p className="text-sm mt-1">{order.resultText}</p>}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            {canUpdate && order.status !== 'completed' && (
              <Button size="sm" variant="outline" onClick={() => onUpdate(order)}>
                Update
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateLabOrderForm({
  patients,
  doctorId,
  defaultPatientId,
  onSubmit,
  loading,
}: {
  patients: Patient[];
  doctorId: string;
  defaultPatientId?: string;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [patientId, setPatientId] = useState(defaultPatientId || '');
  const [testType, setTestType] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ patientId, orderedByDoctorId: doctorId, testType }); }} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Patient *</Label>
        {defaultPatientId ? (
          <div className="h-9 px-3 rounded-lg border bg-muted/50 flex items-center text-sm text-muted-foreground">
            {patients.find((p) => p.id === defaultPatientId)?.firstName}{' '}
            {patients.find((p) => p.id === defaultPatientId)?.lastName} —{' '}
            {patients.find((p) => p.id === defaultPatientId)?.mrn}
          </div>
        ) : (
          <SearchSelect
            items={patients.map((p) => ({
              value: p.id,
              label: `${p.firstName} ${p.lastName}`,
              subtitle: p.mrn,
            }))}
            value={patientId}
            onValueChange={(v) => { setPatientId(v); }}
            placeholder="Select patient"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Test Type *</Label>
        <Input value={testType} onChange={(e) => setTestType(e.target.value)} placeholder="e.g. Complete Blood Count" />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading || !patientId || !testType}>
          {loading ? 'Ordering...' : 'Order Test'}
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
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ status, resultText: resultText || undefined }); }} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v: string | null) => setStatus((v ?? order.status) as LabOrderStatus)}>
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
        <Label>Result Text</Label>
        <Textarea value={resultText} onChange={(e) => setResultText(e.target.value)} placeholder="Enter test results..." />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Order'}</Button>
      </DialogFooter>
    </form>
  );
}
