import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
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
import { Pill, Plus, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Prescription, Patient } from '@/types';
import type { PrescriptionItem } from '@/types';

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: prescriptions, isLoading } = useQuery<Prescription[]>({
    queryKey: ['prescriptions'],
    queryFn: () => api.get('/prescriptions').then((r) => r.data).catch(() => []),
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/prescriptions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      setShowCreate(false);
      toast.success('Prescription created');
    },
    onError: () => toast.error('Failed to create prescription'),
  });

  const handleDownloadPdf = async (id: string) => {
    try {
      const res = await api.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        description="Digital prescriptions with PDF generation"
        action={
          user?.role === 'doctor' ? (
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="size-4" />
              New Prescription
            </Button>
          ) : undefined
        }
      />

      {!prescriptions?.length ? (
        <EmptyState
          icon={Pill}
          title="No prescriptions yet"
          description="Create prescriptions for patients during visits"
        />
      ) : (
        <div className="grid gap-4">
          {prescriptions.map((rx) => (
            <Card key={rx.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold">Prescription</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(rx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDownloadPdf(rx.id)}>
                    <Download className="size-3.5" />
                    PDF
                  </Button>
                </div>
                <div className="space-y-2">
                  {(rx.items as PrescriptionItem[]).map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50">
                      <span className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{item.drugName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.dosage} | {item.frequency} | {item.route} | {item.duration}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Prescription</DialogTitle>
          </DialogHeader>
          <PrescriptionForm
            patients={patients || []}
            doctorId={user?.id || ''}
            onSubmit={(data) => createMutation.mutate(data)}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PrescriptionForm({
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
  const [items, setItems] = useState<PrescriptionItem[]>([
    { drugName: '', dosage: '', frequency: '', route: '', duration: '' },
  ]);

  const addItem = () => {
    setItems([...items, { drugName: '', dosage: '', frequency: '', route: '', duration: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      patientId,
      visitId: '00000000-0000-0000-0000-000000000000',
      doctorId,
      items,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <Label>Medications</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
            <Plus className="size-3" />
            Add Drug
          </Button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-xl border space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary">Drug {i + 1}</span>
              {items.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} className="size-6 text-destructive">
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Drug Name *</Label>
                <Input value={item.drugName} onChange={(e) => updateItem(i, 'drugName', e.target.value)} placeholder="e.g. Amoxicillin" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dosage *</Label>
                <Input value={item.dosage} onChange={(e) => updateItem(i, 'dosage', e.target.value)} placeholder="e.g. 500mg" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Frequency *</Label>
                <Input value={item.frequency} onChange={(e) => updateItem(i, 'frequency', e.target.value)} placeholder="e.g. 3x daily" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Route *</Label>
                <Input value={item.route} onChange={(e) => updateItem(i, 'route', e.target.value)} placeholder="e.g. Oral" required />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Duration *</Label>
              <Input value={item.duration} onChange={(e) => updateItem(i, 'duration', e.target.value)} placeholder="e.g. 7 days" required />
            </div>
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading || !patientId || items.some((i) => !i.drugName)}>
          {loading ? 'Creating...' : 'Create Prescription'}
        </Button>
      </DialogFooter>
    </form>
  );
}
