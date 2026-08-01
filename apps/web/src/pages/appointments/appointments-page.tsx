import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { SearchSelect } from '@/components/shared/search-select';
import {
  CalendarCheck, Plus, Clock, X, Calendar, CalendarDays, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment, Patient, User } from '@/types';

type ViewMode = 'day' | 'week';

function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1));
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function AppointmentsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [drillDate, setDrillDate] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  const [showBook, setShowBook] = useState(false);
  const [bookDoctorPreFill, setBookDoctorPreFill] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  const { data: allAppointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments-all'],
    queryFn: () => api.get('/appointments').then((r) => r.data).catch(() => []),
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data),
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data).catch(() => []),
  });

  const doctors = useMemo(() => (users || []).filter((u) => u.role === 'doctor'), [users]);
  const patientMap = useMemo(() => new Map((patients || []).map((p) => [p.id, p])), [patients]);
  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d])), [doctors]);

  const bookMutation = useMutation({
    mutationFn: (data: { patientId: string; doctorId: string; scheduledAt: string }) =>
      api.post('/appointments', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['appointments-all'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-queue'] });
      setShowBook(false);
      setBookDoctorPreFill('');
      const qn = res.data?.queueNumber;
      toast.success(qn ? `Appointment booked — Queue #${qn}` : 'Appointment booked successfully');
    },
    onError: () => toast.error('Failed to book appointment'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/appointments/${id}/status`, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-all'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-queue'] });
      setCancelTarget(null);
      toast.success('Appointment cancelled');
    },
    onError: () => toast.error('Failed to cancel appointment'),
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ appt, newDate }: { appt: Appointment; newDate: string }) => {
      await api.patch(`/appointments/${appt.id}/status`, { status: 'cancelled' });
      const res = await api.post('/appointments', {
        patientId: appt.patientId,
        doctorId: appt.doctorId,
        scheduledAt: newDate,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments-all'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-queue'] });
      setRescheduleTarget(null);
      setRescheduleDate('');
      const qn = data?.queueNumber;
      toast.success(qn ? `Appointment rescheduled — New queue #${qn}` : 'Appointment rescheduled');
    },
    onError: () => toast.error('Failed to reschedule appointment'),
  });

  const canCancel = (appt: Appointment) =>
    appt.status === 'booked' || appt.status === 'checked_in';
  const canReschedule = (appt: Appointment) =>
    appt.status === 'booked' || appt.status === 'checked_in';

  // Filter appointments for current view
  const viewAppointments = useMemo(() => {
    if (!allAppointments) return [];
    const target = drillDate || selectedDate;
    if (viewMode === 'day') {
      return allAppointments.filter((a) => isSameDay(new Date(a.scheduledAt), target));
    }
    // week view
    const weekDates = getWeekDates(selectedDate);
    return allAppointments.filter((a) =>
      weekDates.some((d) => isSameDay(new Date(a.scheduledAt), d)),
    );
  }, [allAppointments, selectedDate, drillDate, viewMode]);

  // Group by doctor
  const doctorAppointments = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appt of viewAppointments) {
      const list = map.get(appt.doctorId) || [];
      list.push(appt);
      map.set(appt.doctorId, list);
    }
    // Sort each list by scheduledAt
    for (const [key, list] of map) {
      list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }
    return map;
  }, [viewAppointments]);

  const handleColumnBook = (doctorId: string) => {
    setBookDoctorPreFill(doctorId);
    setShowBook(true);
  };

  const navigateDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
    setDrillDate(null);
  };

  const navigateWeek = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta * 7);
    setSelectedDate(d);
    setDrillDate(null);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Appointments" description="Loading..." />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="min-w-[280px] flex-1">
              <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-16 w-full rounded-xl" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Appointments"
        description={viewMode === 'day'
          ? `Schedule for ${formatDate(drillDate || selectedDate)}`
          : `Week of ${formatDate(getWeekDates(selectedDate)[0])}`
        }
        action={
          <Button onClick={() => { setBookDoctorPreFill(''); setShowBook(true); }} className="gap-2">
            <Plus className="size-4" />
            Book Appointment
          </Button>
        }
      />

      {/* View Toggle & Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5 bg-muted/30">
            <button
              onClick={() => { setViewMode('day'); setDrillDate(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'day' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <CalendarDays className="size-3.5" />
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'week' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Calendar className="size-3.5" />
              Week
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => viewMode === 'day' ? navigateDay(-1) : navigateWeek(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setSelectedDate(new Date()); setDrillDate(null); }}>
            Today
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => viewMode === 'day' ? navigateDay(1) : navigateWeek(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'week' && !drillDate && (
        <>
          {/* Week view: summary per day per doctor */}
          {doctors.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No doctors available"
              description="Add doctors to see their weekly schedule" />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {doctors.map((doc) => {
                const weekDates = getWeekDates(selectedDate);
                return (
                  <Card key={doc.id} className="min-w-[200px] flex-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Dr. {doc.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{(doc as any).specialty || 'General Practitioner'}</p>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {weekDates.map((d) => {
                        const dayApps = allAppointments?.filter(
                          (a) => a.doctorId === doc.id && isSameDay(new Date(a.scheduledAt), d),
                        ) || [];
                        const bookedCount = dayApps.filter((a) => a.status === 'booked').length;
                        const isToday = isSameDay(d, new Date());
                        return (
                          <button
                            key={d.toISOString()}
                            onClick={() => { setDrillDate(d); setViewMode('day'); }}
                            className={`w-full text-left p-2 rounded-lg text-xs transition-colors hover:bg-muted/50 ${
                              isToday ? 'bg-primary/5 border border-primary/20' : ''
                            }`}
                          >
                            <span className="font-medium">{formatDayName(d)}</span>
                            <span className={`ml-2 ${bookedCount > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                              {bookedCount} booked
                            </span>
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {(viewMode === 'day' || drillDate) && (
        <>
          {doctorAppointments.size === 0 ? (
            <EmptyState icon={CalendarCheck} title="No appointments"
              description={viewMode === 'day'
                ? `No appointments for ${formatDate(drillDate || selectedDate)}`
                : 'No appointments this week'
              }
              action={
                <Button onClick={() => { setBookDoctorPreFill(''); setShowBook(true); }} className="gap-2">
                  <Plus className="size-4" />
                  Book Appointment
                </Button>
              }
            />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {Array.from(doctorAppointments.entries()).map(([doctorId, appts]) => {
                const doc = doctorMap.get(doctorId);
                return (
                  <Card key={doctorId} className="min-w-[280px] flex-1">
                    <CardHeader className="pb-2 border-b">
                      <CardTitle className="text-sm">Dr. {doc?.name || 'Unknown'}</CardTitle>
                      <p className="text-xs text-muted-foreground">{(doc as any)?.specialty || 'General Practitioner'}</p>
                    </CardHeader>
                    <CardContent className="pt-3 space-y-2">
                      {appts.map((appt) => {
                        const patient = patientMap.get(appt.patientId);
                        return (
                          <div key={appt.id}
                            className={`p-3 rounded-xl text-sm transition-colors ${
                              appt.status === 'in_progress'
                                ? 'ring-2 ring-amber-400 bg-amber-50/50'
                                : appt.status === 'completed'
                                ? 'opacity-60 bg-muted/20'
                                : appt.status === 'cancelled' || appt.status === 'no_show'
                                ? 'opacity-50 bg-red-50/30 line-through'
                                : 'bg-muted/40 hover:bg-muted/70'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-primary text-xs">#{appt.queueNumber}</span>
                                  <span className="font-semibold truncate">
                                    {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                  <Clock className="size-3" />
                                  {new Date(appt.scheduledAt).toLocaleTimeString([], {
                                    hour: '2-digit', minute: '2-digit',
                                  })}
                                  {patient && <><span>·</span><span className="font-mono">{patient.mrn}</span></>}
                                </div>
                              </div>
                              <StatusBadge status={appt.status} />
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                              {canCancel(appt) && (
                                <Button
                                  size="sm" variant="outline"
                                  className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => setCancelTarget(appt)}
                                >
                                  <X className="size-3" />
                                  Cancel
                                </Button>
                              )}
                              {canReschedule(appt) && (
                                <Button
                                  size="sm" variant="outline"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => {
                                    setRescheduleTarget(appt);
                                    const dt = new Date(appt.scheduledAt);
                                    dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
                                    setRescheduleDate(dt.toISOString().slice(0, 16));
                                  }}
                                >
                                  <Calendar className="size-3" />
                                  Reschedule
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {/* Click-to-book empty space */}
                      <button
                        onClick={() => handleColumnBook(doctorId)}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-muted-300 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        <Plus className="size-3.5 inline mr-1" />
                        Quick Book with Dr. {doc?.name?.split(' ')[0] || 'this doctor'}
                      </button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Book Appointment Dialog */}
      <Dialog open={showBook} onOpenChange={setShowBook}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          <BookAppointmentForm
            patients={patients || []}
            doctors={doctors}
            prefillDoctorId={bookDoctorPreFill}
            onSubmit={(data) => bookMutation.mutate(data)}
            loading={bookMutation.isPending}
            onClose={() => { setShowBook(false); setBookDoctorPreFill(''); }}
          />
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <Dialog open={!!cancelTarget} onOpenChange={(o) => { if (!o) setCancelTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Cancel appointment for{' '}
              <strong>
                {cancelTarget ? patientMap.get(cancelTarget.patientId)?.firstName + ' ' + patientMap.get(cancelTarget.patientId)?.lastName : ''}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Go back</Button>
            <Button
              variant="destructive"
              onClick={() => { if (cancelTarget) cancelMutation.mutate(cancelTarget.id); }}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleTarget} onOpenChange={(o) => { if (!o) { setRescheduleTarget(null); setRescheduleDate(''); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Choose a new date and time for{' '}
              {rescheduleTarget ? patientMap.get(rescheduleTarget.patientId)?.firstName + ' ' + patientMap.get(rescheduleTarget.patientId)?.lastName : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>New Date & Time</Label>
              <Input
                type="datetime-local"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setRescheduleTarget(null); setRescheduleDate(''); }}>
                Cancel
              </Button>
              <Button
                disabled={!rescheduleDate || rescheduleMutation.isPending}
                onClick={() => {
                  if (rescheduleTarget && rescheduleDate) {
                    rescheduleMutation.mutate({ appt: rescheduleTarget, newDate: rescheduleDate });
                  }
                }}
              >
                {rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm Reschedule'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookAppointmentForm({
  patients, doctors, prefillDoctorId, onSubmit, loading, onClose,
}: {
  patients: Patient[]; doctors: User[]; prefillDoctorId: string;
  onSubmit: (data: { patientId: string; doctorId: string; scheduledAt: string }) => void;
  loading: boolean; onClose: () => void;
}) {
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState(prefillDoctorId || '');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ patientId, doctorId, scheduledAt });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Patient *</Label>
        <SearchSelect
          items={patients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}`, subtitle: p.mrn }))}
          value={patientId} onValueChange={setPatientId} placeholder="Select patient"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Doctor *</Label>
        <SearchSelect
          items={doctors.map((d) => ({ value: d.id, label: `Dr. ${d.name}`, subtitle: (d as any).specialty || 'General Practitioner' }))}
          value={doctorId} onValueChange={setDoctorId} placeholder="Select doctor"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Date & Time *</Label>
        <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading || !patientId || !doctorId || !scheduledAt}>
          {loading ? 'Booking...' : 'Book Appointment'}
        </Button>
      </DialogFooter>
    </form>
  );
}
