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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Stethoscope, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Visit, Patient } from '@/types';

export default function VisitsPage() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: visits, isLoading } = useQuery<Visit[]>({
    queryKey: ['visits'],
    queryFn: () => api.get('/visits').then((r) => r.data).catch(() => []),
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/visits', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      setShowCreate(false);
      toast.success('Visit recorded');
    },
    onError: () => toast.error('Failed to record visit'),
  });

  if (isLoading) return <LoadingPage />;

  const canCreate = ['doctor', 'nurse'].includes(user?.role || '');

  return (
    <div>
      <PageHeader
        title="Visits"
        description="SOAP notes and visit records"
        action={
          canCreate ? (
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="size-4" />
              New Visit
            </Button>
          ) : undefined
        }
      />

      {!visits?.length ? (
        <EmptyState
          icon={Stethoscope}
          title="No visits recorded"
          description="Start recording patient visits with SOAP notes"
        />
      ) : (
        <div className="grid gap-4">
          {visits.map((visit) => (
            <Card key={visit.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-semibold">Visit Record</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(visit.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {visit.subjective && (
                    <SoapField label="Subjective" value={visit.subjective} />
                  )}
                  {visit.objective && (
                    <SoapField label="Objective" value={visit.objective} />
                  )}
                  {visit.assessment && (
                    <SoapField label="Assessment" value={visit.assessment} />
                  )}
                  {visit.plan && (
                    <SoapField label="Plan" value={visit.plan} />
                  )}
                </div>
                {visit.diagnosisDescription && (
                  <div className="mt-3 p-2 rounded-lg bg-primary/5 text-sm">
                    <span className="font-medium text-primary">Diagnosis:</span>{' '}
                    {visit.diagnosisCode && <span className="font-mono text-xs bg-primary/10 px-1.5 py-0.5 rounded mr-1">{visit.diagnosisCode}</span>}
                    {visit.diagnosisDescription}
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
            <DialogTitle>Record Visit</DialogTitle>
          </DialogHeader>
          <VisitForm
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

function SoapField({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/50">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function VisitForm({
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
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [diagnosisCode, setDiagnosisCode] = useState('');
  const [diagnosisDescription, setDiagnosisDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      patientId,
      appointmentId: '00000000-0000-0000-0000-000000000000',
      doctorId,
      subjective,
      objective,
      assessment,
      plan,
      diagnosisCode,
      diagnosisDescription,
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
      <div className="space-y-1.5">
        <Label>Subjective</Label>
        <Textarea placeholder="Patient's symptoms and concerns..." value={subjective} onChange={(e) => setSubjective(e.target.value)} rows={3} />
      </div>
      <div className="space-y-1.5">
        <Label>Objective</Label>
        <Textarea placeholder="Physical findings, vitals, observations..." value={objective} onChange={(e) => setObjective(e.target.value)} rows={3} />
      </div>
      <div className="space-y-1.5">
        <Label>Assessment</Label>
        <Textarea placeholder="Clinical assessment and differential diagnosis..." value={assessment} onChange={(e) => setAssessment(e.target.value)} rows={3} />
      </div>
      <div className="space-y-1.5">
        <Label>Plan</Label>
        <Textarea placeholder="Treatment plan, medications, follow-up..." value={plan} onChange={(e) => setPlan(e.target.value)} rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Diagnosis Code</Label>
          <Input placeholder="e.g. J06.9" value={diagnosisCode} onChange={(e) => setDiagnosisCode(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Diagnosis</Label>
          <Input placeholder="Diagnosis description" value={diagnosisDescription} onChange={(e) => setDiagnosisDescription(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => { /* Dialog closes via onOpenChange */ }}>Cancel</Button>
        <Button type="submit" disabled={loading || !patientId}>
          {loading ? 'Saving...' : 'Save Visit'}
        </Button>
      </DialogFooter>
    </form>
  );
}
