import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CalendarCheck, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment, Patient, User } from '@/types';

export default function AppointmentsPage() {
  const [showBook, setShowBook] = useState(false);
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments-queue'],
    queryFn: () => api.get('/appointments/queue/00000000-0000-0000-0000-000000000000').then((r) => r.data).catch(() => []),
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data),
  });

  const { data: doctors } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data).catch(() => []),
  });

  const bookMutation = useMutation({
    mutationFn: (data: { patientId: string; doctorId: string; scheduledAt: string }) =>
      api.post('/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowBook(false);
      toast.success('Appointment booked successfully');
    },
    onError: () => toast.error('Failed to book appointment'),
  });

  if (isLoading) return <LoadingPage />;

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Book and manage patient appointments"
        action={
          <Button onClick={() => setShowBook(true)} className="gap-2">
            <Plus className="size-4" />
            Book Appointment
          </Button>
        }
      />

      {!appointments?.length ? (
        <EmptyState
          icon={CalendarCheck}
          title="No appointments yet"
          description="Book your first appointment to get started"
          action={
            <Button onClick={() => setShowBook(true)} className="gap-2">
              <Plus className="size-4" />
              Book Appointment
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {appointments.map((appt) => (
            <Card key={appt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center size-12 rounded-xl bg-primary text-primary-foreground font-bold text-lg">
                    #{appt.queueNumber}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      Queue #{appt.queueNumber}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                      <Clock className="size-3.5" />
                      {new Date(appt.scheduledAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BookAppointmentDialog
        open={showBook}
        onOpenChange={setShowBook}
        patients={patients || []}
        doctors={(doctors || []).filter((d) => d.role === 'doctor')}
        onSubmit={(data) => bookMutation.mutate(data)}
        loading={bookMutation.isPending}
      />
    </div>
  );
}

function BookAppointmentDialog({
  open,
  onOpenChange,
  patients,
  doctors,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patients: Patient[];
  doctors: User[];
  onSubmit: (data: { patientId: string; doctorId: string; scheduledAt: string }) => void;
  loading: boolean;
}) {
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ patientId, doctorId, scheduledAt });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Patient *</Label>
            <Select value={patientId} onValueChange={(v: string | null) => setPatientId(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.mrn})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Doctor *</Label>
            <Select value={doctorId} onValueChange={(v: string | null) => setDoctorId(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date & Time *</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !patientId || !doctorId || !scheduledAt}>
              {loading ? 'Booking...' : 'Book Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
