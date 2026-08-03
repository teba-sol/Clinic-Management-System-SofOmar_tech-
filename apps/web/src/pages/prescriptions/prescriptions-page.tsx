import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { cachedGet } from '@/lib/offline-queue';
import { useAuth } from '@/context/auth-context';
import { usePatientContext } from '@/context/patient-context';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { SearchSelect } from '@/components/shared/search-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Pill, Plus, Download, Trash2, Calculator, Check, Ban } from 'lucide-react';
import { toast } from 'sonner';
import type { Prescription, Patient, Visit, Vital } from '@/types';
import type { PrescriptionItem, PrescriptionStatus } from '@/types';

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const { patient: contextPatient } = usePatientContext();
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

  const { data: visits } = useQuery<Visit[]>({
    queryKey: ['visits'],
    queryFn: () => api.get('/visits').then((r) => r.data).catch(() => []),
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

  const canDispense = user?.role === 'admin' || user?.role === 'nurse' || user?.role === 'cashier';

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PrescriptionStatus }) =>
      api.patch(`/prescriptions/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast.success('Prescription status updated');
    },
    onError: () => toast.error('Failed to update prescription status'),
  });

  const statusStyles: Record<PrescriptionStatus, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
    dispensed: { label: 'Dispensed', className: 'bg-emerald-100 text-emerald-800' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
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
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        statusStyles[(rx.status as PrescriptionStatus) || 'pending'].className
                      }`}
                    >
                      {statusStyles[(rx.status as PrescriptionStatus) || 'pending'].label}
                    </span>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDownloadPdf(rx.id)}>
                      <Download className="size-3.5" />
                      PDF
                    </Button>
                  </div>
                </div>
                {rx.status === 'dispensed' && rx.dispensedAt && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Dispensed on {new Date(rx.dispensedAt).toLocaleString()}
                  </p>
                )}
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
                {canDispense && rx.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: rx.id, status: 'dispensed' })}
                    >
                      <Check className="size-3.5" />
                      Mark Dispensed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-red-600"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: rx.id, status: 'cancelled' })}
                    >
                      <Ban className="size-3.5" />
                      Cancel
                    </Button>
                  </div>
                )}
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
            visits={visits || []}
            doctorId={user?.id || ''}
            defaultPatientId={contextPatient?.id || ''}
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
  visits,
  doctorId,
  defaultPatientId,
  onSubmit,
  loading,
}: {
  patients: Patient[];
  visits: Visit[];
  doctorId: string;
  defaultPatientId?: string;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [patientId, setPatientId] = useState(defaultPatientId || '');
  const [visitId, setVisitId] = useState('');
  const [items, setItems] = useState<PrescriptionItem[]>([
    { drugName: '', dosage: '', frequency: '', route: '', duration: '' },
  ]);
  const [calc, setCalc] = useState<{ mgPerKg: string; weightKg: string }[]>([
    { mgPerKg: '', weightKg: '' },
  ]);

  const { data: patientVitals } = useQuery<Vital[]>({
    queryKey: ['vitals', 'patient', patientId],
    queryFn: () =>
      cachedGet<Vital[]>(`/vitals/patient/${patientId}`)
        .then((r) => r.data)
        .catch(() => []),
    enabled: !!patientId,
  });

  useEffect(() => {
    const latestWeight = patientVitals && patientVitals.length > 0
      ? patientVitals[patientVitals.length - 1]?.weight ?? ''
      : '';
    if (latestWeight) {
      setCalc((prev) => prev.map((c) => ({ ...c, weightKg: latestWeight })));
    }
  }, [patientVitals]);

  const filteredVisits = patientId ? visits.filter((v) => v.patientId === patientId) : [];

  const addItem = () => {
    setItems([...items, { drugName: '', dosage: '', frequency: '', route: '', duration: '' }]);
    setCalc([...calc, { mgPerKg: '', weightKg: calc[calc.length - 1]?.weightKg || '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      setCalc(calc.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const updateCalc = (index: number, field: 'mgPerKg' | 'weightKg', value: string) => {
    const updated = [...calc];
    updated[index] = { ...updated[index], [field]: value };
    setCalc(updated);
  };

  const runDosageCalc = (index: number) => {
    const mgPerKg = parseFloat(calc[index].mgPerKg);
    const weightKg = parseFloat(calc[index].weightKg);
    if (isNaN(mgPerKg) || isNaN(weightKg) || mgPerKg <= 0 || weightKg <= 0) {
      toast.error('Enter valid mg/kg dose and weight');
      return;
    }
    const doseMg = Math.round(mgPerKg * weightKg);
    updateItem(index, 'dosage', `${doseMg}mg`);
    toast.success(`Calculated: ${doseMg}mg per dose`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      patientId,
      visitId: visitId || '00000000-0000-0000-0000-000000000000',
      doctorId,
      items,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            onValueChange={(v) => { setPatientId(v); setVisitId(''); }}
            placeholder="Select patient"
          />
        )}
      </div>

      {patientId && filteredVisits.length > 0 && (
        <div className="space-y-1.5">
          <Label>Link to Visit</Label>
          <SearchSelect
            items={filteredVisits.map((v) => ({
              value: v.id,
              label: new Date(v.createdAt).toLocaleDateString(),
              subtitle: v.diagnosisDescription || 'SOAP visit',
            }))}
            value={visitId}
            onValueChange={setVisitId}
            placeholder="Optional — select visit"
          />
        </div>
      )}

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
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2">
                <Calculator className="size-3.5" />
                Weight-based dose calculator
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Dose (mg/kg)</Label>
                  <Input type="number" min={0} step="any" value={calc[i].mgPerKg} onChange={(e) => updateCalc(i, 'mgPerKg', e.target.value)} placeholder="e.g. 15" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Weight (kg)</Label>
                  <Input type="number" min={0} step="any" value={calc[i].weightKg} onChange={(e) => updateCalc(i, 'weightKg', e.target.value)} placeholder="e.g. 20" />
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2 gap-1" onClick={() => runDosageCalc(i)}>
                <Calculator className="size-3.5" />
                Calculate dose
              </Button>
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
