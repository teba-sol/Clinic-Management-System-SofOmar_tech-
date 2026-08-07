import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { usePatientContext } from '@/context/patient-context';
import { useOffline } from '@/context/offline-context';
import { enqueue } from '@/lib/offline-queue';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { getApiError } from '@/lib/api';
import { toLocalDateInput, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchSelect } from '@/components/shared/search-select';
import { SlotPicker } from '@/components/appointments/slot-picker';
import { StatusBadge } from '@/components/shared/status-badge';
import { PriorityBadge } from '@/components/shared/priority-badge';
import { PriorityDialog } from '@/components/appointments/priority-dialog';
import { LabOrderPatientInfo } from '@/components/shared/lab-order-patient-info';
import { AdminClinicPerformance } from '@/components/dashboard/admin-clinic-performance';
import { getGreeting, getClinicToday } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription,
} from '@/components/ui/sheet';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Users, FlaskConical, Receipt, Stethoscope,
  ClipboardList, TrendingUp, Activity, CalendarPlus, Clock,
  ArrowRight, Play, UserPlus, Inbox, HeartPulse, Thermometer,
  Weight, Ruler, Phone, Mail, MapPin, AlertTriangle, Syringe, Flag,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Patient, Appointment, AppointmentPriority, LabOrder, LabOrderStatus, Invoice, User, Visit, Vital, CreateVitalDto, UpdateVitalDto, BookingRequest } from '@/types';

function departmentLabel(department: string): string {
  return department.startsWith('landing.') ? department.replace('landing.', '') : department;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { setPatient, setVisit } = usePatientContext();
  const navigate = useNavigate();

  if (!user) return null;

  // Shared data
  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data),
    enabled: ['admin', 'receptionist', 'nurse', 'doctor'].includes(user.role),
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ['appointments-queue', user.role === 'doctor' ? user.id : 'all'],
    queryFn: () =>
      user.role === 'doctor'
        ? api.get(`/appointments/queue/${user.id}`).then((r) => r.data)
        : api.get('/appointments/queue').then((r) => r.data).catch(() => []),
    enabled: ['doctor', 'nurse', 'admin', 'receptionist'].includes(user.role),
  });

  const { data: labOrders } = useQuery<LabOrder[]>({
    queryKey: ['lab-orders'],
    queryFn: () => api.get('/lab-orders').then((r) => r.data).catch(() => []),
    enabled: ['admin', 'lab_tech'].includes(user.role),
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ['invoices-pending'],
    queryFn: () => api.get('/invoices').then((r) => r.data).catch(() => []),
    enabled: ['admin', 'cashier'].includes(user.role),
  });

  const { data: doctors } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data).catch(() => []),
    enabled: ['admin', 'receptionist'].includes(user.role),
  });

  const greeting = getGreeting;

  const today = getClinicToday();

  const userRole = user.role;

  return (
    <div className="space-y-6">
      {/* Hero Greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.55_0.17_175)] via-[oklch(0.50_0.15_175)] to-[oklch(0.48_0.13_180)] p-6 sm:p-8 text-white">
        <div className="absolute -top-16 -right-16 size-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-12 size-48 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm font-medium mb-1">{today}</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
              {greeting()}, {user.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-white/60 text-sm">Here's what's happening at the clinic today.</p>
          </div>
          {userRole === 'receptionist' && (
            <Button
              variant="secondary"
              className="gap-2 shrink-0"
              onClick={() => navigate('/patients')}
            >
              <UserPlus className="size-4" /> Register Patient
            </Button>
          )}
        </div>
      </div>

      {/* Role-specific content */}
      {userRole === 'doctor' && (
        <DoctorDashboard
          appointments={appointments || []}
          patients={patients || []}
          userId={user.id}
          setPatient={setPatient}
          setVisit={setVisit}
          navigate={navigate}
        />
      )}
      {userRole === 'receptionist' && (
        <ReceptionistDashboard
          appointments={appointments || []}
          patients={patients || []}
          doctors={(doctors || []).filter((d) => d.role === 'doctor')}
        />
      )}
      {userRole === 'nurse' && (
        <NurseDashboard
          appointments={appointments || []}
          patients={patients || []}
        />
      )}
      {userRole === 'lab_tech' && (
        <LabTechDashboard labOrders={labOrders || []} />
      )}
      {userRole === 'cashier' && (
        <CashierDashboard invoices={invoices || []} />
      )}
      {userRole === 'admin' && (
        <AdminDashboard
          appointments={appointments || []}
          patients={patients || []}
          pendingLabOrders={labOrders || []}
          doctors={(doctors || []).filter((d) => d.role === 'doctor')}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, description, onClick }: {
  title: string; value: string | number; icon: React.ElementType; color: string; description?: string; onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      className={`${onClick ? 'cursor-pointer hover:shadow-lg active:scale-[0.98]' : ''} transition-all duration-200`}
    >
      <Card className="hover:shadow-md transition-shadow overflow-hidden">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
              {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </div>
            <div className={`flex items-center justify-center size-12 rounded-xl ${color}`}>
              <Icon className="size-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({ label, subtitle, href, icon: Icon, color, bgColor, onClick }: {
  label: string; subtitle: string; href: string; icon: React.ElementType; color: string; bgColor: string; onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'a';
  return (
    <Comp
      {...(onClick ? { onClick, type: 'button' as const } : { href })}
      className={`group flex items-center gap-3 p-3 rounded-xl transition-colors w-full text-left ${bgColor}`}
    >
      <div className={`flex items-center justify-center size-9 rounded-lg ${color} bg-white shadow-sm`}>
        <Icon className="size-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${color}`}>{label}</p>
        <p className={`text-xs ${color}/60`}>{subtitle}</p>
      </div>
      <ArrowRight className={`size-3.5 ${color} opacity-0 group-hover:opacity-100 transition-opacity shrink-0`} />
    </Comp>
  );
}

/* ─── DOCTOR DASHBOARD ─── */
function DoctorDashboard({ appointments, patients, userId, setPatient, setVisit, navigate }: {
  appointments: Appointment[]; patients: Patient[]; userId: string;
  setPatient: (p: Patient | null) => void; setVisit: (v: Visit | null) => void; navigate: (path: string) => void;
}) {
  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const { patient: activePatient } = usePatientContext();
  const ready = appointments
    .filter((a) => a.status === 'checked_in' || a.status === 'triaged')
    .sort((a, b) => a.queueNumber - b.queueNumber);
  const awaitingCheckIn = appointments
    .filter((a) => a.status === 'booked')
    .sort((a, b) => a.queueNumber - b.queueNumber);
  const seenToday = appointments.filter((a) => a.status === 'completed');

  const startVisitMutation = useMutation({
    mutationFn: async (appt: Appointment) => {
      const patient = patientMap.get(appt.patientId);
      if (!patient) throw new Error('Patient not found');
      const res = await api.post('/visits', { appointmentId: appt.id, patientId: appt.patientId, doctorId: userId });
      return { patient, visit: res.data };
    },
    onSuccess: ({ patient, visit }) => {
      setPatient(patient); setVisit(visit);
      navigate(`/patients/${patient.id}`);
      toast.success(`Started visit for ${patient.firstName} ${patient.lastName}`);
    },
    onError: () => toast.error('Failed to start visit'),
  });

  const handleReadyPatient = (appt: Appointment) => {
    if (appt.patientId === activePatient?.id && activePatient) {
      setPatient(activePatient);
      navigate(`/doctor/workspace/${activePatient.id}`);
      return;
    }
    startVisitMutation.mutate(appt);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Ready for you" value={ready.length} icon={Play}
          color="bg-gradient-to-br from-blue-500 to-indigo-500"
          description="Checked in & triaged" />
        <StatCard title="Waiting to arrive" value={awaitingCheckIn.length} icon={Clock}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
          description="Booked, not checked in" />
        <StatCard title="Seen today" value={seenToday.length} icon={Activity}
          color="bg-gradient-to-br from-emerald-500 to-teal-500"
          description="Completed appointments" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Play className="size-4 text-primary" /> Ready for you ({ready.length})
          </CardTitle>
          <CardDescription>Patients checked in and waiting for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {ready.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No patients ready yet — checked-in patients will appear here.
            </p>
          ) : (
            ready.map((appt) => {
              const patient = patientMap.get(appt.patientId);
              const isActive = appt.patientId === activePatient?.id;
              return (
                <div key={appt.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary font-bold shrink-0">
                      #{appt.queueNumber}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{patient?.mrn}</p>
                    </div>
                  </div>
                  <Button size="sm" className="gap-1.5 shrink-0" onClick={() => handleReadyPatient(appt)}>
                    <Play className="size-3.5" />
                    {isActive ? 'Resume visit' : 'Start visit'}
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" /> Awaiting Check-in ({awaitingCheckIn.length})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Patients booked but not yet arrived — reception will check them in. Shown for awareness only.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate('/queue?filter=booked')}>
              View queue <ArrowRight className="size-3.5" />
            </Button>
          </div>
          {awaitingCheckIn.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No patients booked for today yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {awaitingCheckIn.slice(0, 5).map((appt) => {
                const patient = patientMap.get(appt.patientId);
                return (
                  <div key={appt.id} className="flex items-center gap-2 rounded-lg border border-dashed bg-background px-3 py-2 text-sm">
                    <span className="font-bold text-muted-foreground">#{appt.queueNumber}</span>
                    <span className="font-medium text-muted-foreground">
                      {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'}
                    </span>
                    <StatusBadge status="booked">Not checked in</StatusBadge>
                  </div>
                );
              })}
              {awaitingCheckIn.length > 5 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{awaitingCheckIn.length - 5} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/* ─── RECEPTIONIST DASHBOARD ─── */
function ReceptionistDashboard({ appointments, patients, doctors }: {
  appointments: Appointment[]; patients: Patient[]; doctors: User[];
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [bookPatientId, setBookPatientId] = useState('');
  const [bookDoctorId, setBookDoctorId] = useState('');
  const [bookDate, setBookDate] = useState(() => toLocalDateInput(new Date()));
  const [bookSlot, setBookSlot] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Appointment | null>(null);

  useEffect(() => {
    setBookSlot('');
  }, [bookDoctorId, bookDate]);

  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const [liveQueues, setLiveQueues] = useState<Map<string, Appointment[]>>(new Map());
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });
    s.connect();
    s.on('connect', () => setSocketConnected(true));
    s.on('disconnect', () => setSocketConnected(false));
    const handler = (event: string, ...args: any[]) => {
      if (event.startsWith('queue:')) {
        const doctorId = event.slice(6);
        setLiveQueues((prev) => {
          const next = new Map(prev);
          next.set(doctorId, args[0] as Appointment[]);
          return next;
        });
      }
    };
    s.onAny(handler);
    return () => { s.offAny(handler); s.disconnect(); };
  }, []);

  const liveAppointments = useMemo(() => {
    if (liveQueues.size === 0) return appointments;
    const liveIds = new Set<string>();
    const liveList: Appointment[] = [];
    liveQueues.forEach((appts) => {
      appts.forEach((a) => { liveIds.add(a.id); liveList.push(a); });
    });
    const staticOnly = appointments.filter((a) => !liveIds.has(a.id));
    return [...staticOnly, ...liveList];
  }, [appointments, liveQueues]);

  const bookMutation = useMutation({
    mutationFn: (scheduledAt: string) => api.post('/appointments', {
      patientId: bookPatientId,
      doctorId: bookDoctorId,
      scheduledAt,
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['appointments-queue'] });
      const qn = res.data?.queueNumber;
      setBookPatientId(''); setBookDoctorId(''); setBookSlot('');
      toast.success(qn ? `Appointment booked — Queue #${qn}` : 'Appointment booked');
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to book appointment')),
  });

  const handleQuickBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookSlot) {
      toast.error('Please select a time slot');
      return;
    }
    const scheduledAt = `${bookDate}T${bookSlot}`;
    if (new Date(scheduledAt).getTime() <= Date.now()) {
      toast.error('Please choose a future date or time');
      return;
    }
    bookMutation.mutate(scheduledAt);
  };

  const checkInMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/appointments/${id}/status`, { status: 'checked_in' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-queue'] });
      toast.success('Patient checked in');
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to check in patient')),
  });

  const { data: bookingRequests } = useQuery<BookingRequest[]>({
    queryKey: ['booking-requests'],
    queryFn: () => api.get('/booking/requests').then((r) => r.data).catch(() => []),
  });

  const pendingCount = useMemo(() => liveAppointments.filter((a) => a.status === 'booked').length, [liveAppointments]);

  const awaitingCheckIn = useMemo(() =>
    liveAppointments.filter((a) => a.status === 'booked').sort((a, b) => a.queueNumber - b.queueNumber),
    [liveAppointments],
  );

  const checkedInOthers = useMemo(() =>
    liveAppointments.filter((a) => a.status !== 'booked').sort((a, b) => a.queueNumber - b.queueNumber),
    [liveAppointments],
  );

  const pendingRequests = useMemo(
    () => (bookingRequests || []).filter((r) => r.status === 'pending'),
    [bookingRequests],
  );

  const profilePatient = selectedProfile ? patientMap.get(selectedProfile.patientId) : null;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Queue" value={liveAppointments.length} icon={ClipboardList}
          color="bg-gradient-to-br from-blue-500 to-indigo-500" description="Total appointments"
          onClick={() => navigate('/queue')} />
        <StatCard title="Pending" value={pendingCount} icon={Clock}
          color="bg-gradient-to-br from-amber-500 to-orange-500" description="Awaiting check-in"
          onClick={() => navigate('/queue?filter=booked')} />
        <StatCard title="Booking Requests" value={pendingRequests.length} icon={Inbox}
          color="bg-gradient-to-br from-violet-500 to-purple-500" description="Pending online bookings"
          onClick={() => navigate('/booking-requests')} />
        <StatCard title="Total Patients" value={patients.length} icon={Users}
          color="bg-gradient-to-br from-teal-500 to-cyan-500" description="Registered patients"
          onClick={() => navigate('/patients')} />
      </div>

      {/* Pending Booking Requests attention panel */}
      {pendingRequests.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-9 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                  <Inbox className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    Pending Booking Requests ({pendingRequests.length})
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Online booking requests waiting for you to contact and convert into appointments.
                  </p>
                </div>
              </div>
              <Button size="sm" className="gap-1.5 shrink-0" onClick={() => navigate('/booking-requests')}>
                Review requests <ArrowRight className="size-3.5" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {pendingRequests.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-background px-3 py-1.5 text-sm">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs text-muted-foreground">{departmentLabel(r.department)}</span>
                  <StatusBadge status="pending">Pending</StatusBadge>
                </div>
              ))}
              {pendingRequests.length > 4 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{pendingRequests.length - 4} more
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Book */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
              <CalendarPlus className="size-4" />
            </div>
            <h3 className="font-semibold text-sm">Quick Book Appointment</h3>
          </div>
          <form onSubmit={handleQuickBook} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="flex-1 min-w-[170px] space-y-1.5">
                <Label className="text-xs text-muted-foreground">Patient</Label>
                <SearchSelect
                  items={patients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}`, subtitle: p.mrn }))}
                  value={bookPatientId} onValueChange={setBookPatientId} placeholder="Select patient"
                />
              </div>
              <div className="flex-1 min-w-[170px] space-y-1.5">
                <Label className="text-xs text-muted-foreground">Doctor</Label>
                <SearchSelect
                  items={doctors.map((d) => ({ value: d.id, label: `Dr. ${d.name}`, subtitle: (d as any).specialty || 'General Practitioner' }))}
                  value={bookDoctorId} onValueChange={setBookDoctorId} placeholder="Select doctor"
                />
              </div>
              <div className="flex-1 min-w-[150px] space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input type="date" min={toLocalDateInput(new Date())} value={bookDate} onChange={(e) => setBookDate(e.target.value)} className="h-9" />
              </div>
            </div>
            {bookDoctorId && bookDate ? (
              <SlotPicker doctorId={bookDoctorId} date={bookDate} value={bookSlot} onChange={setBookSlot} />
            ) : (
              <p className="text-xs text-muted-foreground">
                Select a doctor and date to see available time slots.
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={bookMutation.isPending || !bookPatientId || !bookDoctorId || !bookDate || !bookSlot}
                className="w-full sm:w-auto h-9 rounded-xl px-6">
                {bookMutation.isPending ? 'Booking...' : 'Book Now'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Today's Queue */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <h3 className="font-semibold">Today's Queue</h3>
            </div>
            {liveAppointments.length > 6 && (
              <a href="/queue" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                View all <ArrowRight className="size-3" />
              </a>
            )}
          </div>
          {liveAppointments.length === 0 ? (
            <div className="py-8 text-center">
              <ClipboardList className="size-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No appointments today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {awaitingCheckIn.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Awaiting check-in ({awaitingCheckIn.length})
                  </p>
                  <div className="space-y-2">
                    {awaitingCheckIn.map((appt) => {
                      const patient = patientMap.get(appt.patientId);
                      return (
                        <div
                          key={appt.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
                          onClick={() => setSelectedProfile(appt)}
                        >
                          <div className="flex items-center justify-center size-10 rounded-xl bg-primary text-primary-foreground font-bold text-sm shrink-0">
                            #{appt.queueNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {patient ? `${patient.firstName} ${patient.lastName}` : `Queue #${appt.queueNumber}`}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              {patient && <span className="font-mono">{patient.mrn}</span>}
                              {patient && <span>·</span>}
                              <Clock className="size-3" />
                              {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <StatusBadge status="booked">Not checked in</StatusBadge>
                          <Button
                            size="sm"
                            className="shrink-0"
                            onClick={(e) => { e.stopPropagation(); checkInMutation.mutate(appt.id); }}
                            disabled={checkInMutation.isPending}
                          >
                            Check In
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {checkedInOthers.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Checked in / in progress ({checkedInOthers.length})
                  </p>
                  <div className="space-y-2">
                    {checkedInOthers.slice(0, 4).map((appt) => {
                      const patient = patientMap.get(appt.patientId);
                      return (
                        <div
                          key={appt.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                          onClick={() => setSelectedProfile(appt)}
                        >
                          <div className="flex items-center justify-center size-10 rounded-xl bg-muted-foreground/10 text-muted-foreground font-bold text-sm shrink-0">
                            #{appt.queueNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {patient ? `${patient.firstName} ${patient.lastName}` : `Queue #${appt.queueNumber}`}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              {patient && <span className="font-mono">{patient.mrn}</span>}
                              {patient && <span>·</span>}
                              <Clock className="size-3" />
                              {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <StatusBadge status={appt.status} />
                        </div>
                      );
                    })}
                    {checkedInOthers.length > 4 && (
                      <p className="text-xs text-muted-foreground pt-1">
                        +{checkedInOthers.length - 4} more checked in
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Profile Dialog (read-only, no clinical data) */}
      <Dialog open={!!selectedProfile} onOpenChange={(o) => { if (!o) setSelectedProfile(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{profilePatient ? `${profilePatient.firstName} ${profilePatient.lastName}` : 'Patient'}</DialogTitle>
            <DialogDescription>Patient information — clinical records are doctor/nurse only</DialogDescription>
          </DialogHeader>
          {profilePatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">MRN</p>
                  <p className="font-mono">{profilePatient.mrn}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Date of Birth</p>
                  <p>{new Date(profilePatient.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="size-3 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Phone</p>
                    <p>{profilePatient.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Email</p>
                    <p>{profilePatient.email || '—'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="size-3 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Address</p>
                  <p className="text-sm">{profilePatient.address || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="size-3 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-600 font-medium">Allergies</p>
                  <p className="text-sm">{profilePatient.allergies || 'None recorded'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProfile(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── NURSE DASHBOARD ─── */
function NurseDashboard({ appointments, patients }: { appointments: Appointment[]; patients: Patient[] }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { setPatient } = usePatientContext();
  const { isOnline, lastSyncAt, refreshPendingCount } = useOffline();
  const [triagePatient, setTriagePatient] = useState<Appointment | null>(null);
  const [vitalsForm, setVitalsForm] = useState({ bp: '', temp: '', pulse: '', weight: '', height: '', complaint: '' });
  const [existingVitalsRecord, setExistingVitalsRecord] = useState<Vital | null>(null);
  const [triagePriority, setTriagePriority] = useState<AppointmentPriority>('routine');
  const [triagePriorityReason, setTriagePriorityReason] = useState('');
  const [priorityTarget, setPriorityTarget] = useState<Appointment | null>(null);

  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const checkedIn = appointments.filter((a) => a.status === 'checked_in');
  const triaged = appointments.filter((a) => a.status === 'triaged');
  const inProgress = appointments.filter((a) => a.status === 'in_progress');

  const priorityMutation = useMutation({
    mutationFn: ({ id, priority, reason }: { id: string; priority: AppointmentPriority; reason?: string }) =>
      api.patch(`/appointments/${id}/priority`, { priority, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-queue'] });
      setPriorityTarget(null);
      toast.success('Priority updated');
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to update priority')),
  });

  const { data: fetchedVitals, refetch: refetchVitals } = useQuery<Vital[]>({
    queryKey: ['vitals', 'appointment', triagePatient?.id],
    queryFn: () => api.get(`/vitals/appointment/${triagePatient!.id}`).then((r) => r.data),
    enabled: !!triagePatient,
  });

  useEffect(() => {
    if (fetchedVitals && fetchedVitals.length > 0) {
      const latest = fetchedVitals[fetchedVitals.length - 1];
      setExistingVitalsRecord(latest);
      setVitalsForm({
        bp: latest.bloodPressure || '',
        temp: latest.temperature || '',
        pulse: latest.pulse || '',
        weight: latest.weight || '',
        height: latest.height || '',
        complaint: latest.chiefComplaint || '',
      });
    } else {
      setExistingVitalsRecord(null);
      setVitalsForm({ bp: '', temp: '', pulse: '', weight: '', height: '', complaint: '' });
    }
  }, [fetchedVitals]);

  const createVitalsMutation = useMutation({
    mutationFn: (data: CreateVitalDto) => api.post('/vitals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-queue'] });
      refetchVitals();
      toast.success('Vitals recorded — patient sent to triage queue');
    },
    onError: () => toast.error('Failed to record vitals'),
  });

  const updateVitalsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVitalDto }) => api.patch(`/vitals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-queue'] });
      refetchVitals();
      toast.success('Vitals updated');
    },
    onError: () => toast.error('Failed to update vitals'),
  });

  const openTriage = (appt: Appointment) => {
    setTriagePatient(appt);
    setTriagePriority(appt.priority === 'routine' || !appt.priority ? 'routine' : appt.priority);
    setTriagePriorityReason(appt.priorityReason ?? '');
    const p = patientMap.get(appt.patientId);
    if (p) setPatient(p);
  };

  const closeTriage = () => {
    setTriagePatient(null);
    setExistingVitalsRecord(null);
    setTriagePriority('routine');
    setTriagePriorityReason('');
    setVitalsForm({ bp: '', temp: '', pulse: '', weight: '', height: '', complaint: '' });
  };

  useEffect(() => {
    if (lastSyncAt) {
      queryClient.invalidateQueries({ queryKey: ['appointments-queue'] });
      queryClient.invalidateQueries({ queryKey: ['vitals'] });
    }
  }, [lastSyncAt, queryClient]);

  const submitTriage = async () => {
    if (!triagePatient || !user) return;

    const payload = {
      bloodPressure: vitalsForm.bp || undefined,
      temperature: vitalsForm.temp || undefined,
      pulse: vitalsForm.pulse || undefined,
      weight: vitalsForm.weight || undefined,
      height: vitalsForm.height || undefined,
      chiefComplaint: vitalsForm.complaint || undefined,
    };

    if (!isOnline) {
      if (existingVitalsRecord) {
        await enqueue({
          id: crypto.randomUUID(),
          type: 'vital-update',
          method: 'PATCH',
          url: `/vitals/${existingVitalsRecord.id}`,
          payload,
          createdAt: new Date().toISOString(),
        });
      } else {
        await enqueue({
          id: crypto.randomUUID(),
          type: 'vital-create',
          method: 'POST',
          url: '/vitals',
          payload: {
            appointmentId: triagePatient.id,
            patientId: triagePatient.patientId,
            recordedByNurseId: user.id,
            ...payload,
          },
          createdAt: new Date().toISOString(),
        });
      }
      await refreshPendingCount();
      toast.info('Vitals saved offline — will sync automatically when you reconnect');
      return;
    }

    if (existingVitalsRecord) {
      updateVitalsMutation.mutate({
        id: existingVitalsRecord.id,
        data: payload,
      });
    } else {
      createVitalsMutation.mutate({
        appointmentId: triagePatient.id,
        patientId: triagePatient.patientId,
        recordedByNurseId: user.id,
        ...payload,
      });
    }

    if (triagePriority !== (triagePatient.priority || 'routine')) {
      priorityMutation.mutate({
        id: triagePatient.id,
        priority: triagePriority,
        reason: triagePriorityReason || vitalsForm.complaint || undefined,
      });
    }
  };

  const patientName = triagePatient ? patientMap.get(triagePatient.patientId) : null;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Checked In" value={checkedIn.length} icon={HeartPulse}
          color="bg-gradient-to-br from-blue-500 to-indigo-500" description="Vitals pending" />
        <StatCard title="Triaged" value={triaged.length} icon={Activity}
          color="bg-gradient-to-br from-purple-500 to-violet-500" description="Awaiting doctor" />
        <StatCard title="With Doctor" value={inProgress.length} icon={Stethoscope}
          color="bg-gradient-to-br from-violet-500 to-purple-500" description="In consultation" />
      </div>

      {/* Needs Vitals (Ready for Triage) Section */}
      {checkedIn.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <HeartPulse className="size-4 text-blue-600" />
              <h3 className="font-semibold text-blue-600">Needs Vitals ({checkedIn.length})</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Patients checked in and ready for you to record vitals — your next action.
            </p>
            <div className="space-y-2">
              {checkedIn.slice(0, 10).map((appt) => {
                const p = patientMap.get(appt.patientId);
                return (
                  <div key={appt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-sm font-bold text-muted-foreground shrink-0">#{appt.queueNumber}</span>
                      <PriorityBadge priority={appt.priority} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{p ? `${p.firstName} ${p.lastName}` : 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p?.mrn} · {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Set priority"
                        className="size-8 text-muted-foreground hover:text-amber-600"
                        onClick={() => setPriorityTarget(appt)}
                      >
                        <Flag className="size-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openTriage(appt)} className="shrink-0">
                        Record Vitals
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Triaged Section — vitals recorded, awaiting doctor */}
      {triaged.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3 text-purple-600">
              <Activity className="size-4" /> Triaged — Awaiting Doctor ({triaged.length})
            </h3>
            <div className="space-y-2">
              {[...triaged]
                .sort((a, b) => Number(b.returnedForRecheck) - Number(a.returnedForRecheck) || a.queueNumber - b.queueNumber)
                .slice(0, 10)
                .map((appt) => {
                const p = patientMap.get(appt.patientId);
                return (
                  <div key={appt.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-sm font-bold text-muted-foreground shrink-0">#{appt.queueNumber}</span>
                      <PriorityBadge priority={appt.priority} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{p ? `${p.firstName} ${p.lastName}` : 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p?.mrn} · {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {appt.returnedForRecheck && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 shrink-0">
                        <AlertTriangle className="size-3" /> Returned by doctor
                      </span>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openTriage(appt)} className="shrink-0">
                      View / Edit Vitals
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Queue — full-day, all-statuses overview */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" />
              <h3 className="font-semibold">Today's Queue ({appointments.length})</h3>
            </div>
            <span className="text-xs text-muted-foreground">Full-day overview · all statuses</span>
          </div>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No appointments today</p>
          ) : (
            <div className="divide-y rounded-xl border">
              {[...appointments].sort((a, b) => a.queueNumber - b.queueNumber).slice(0, 12).map((appt) => {
                const p = patientMap.get(appt.patientId);
                return (
                  <div key={appt.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="w-8 shrink-0 font-bold text-muted-foreground">#{appt.queueNumber}</span>
                    <PriorityBadge priority={appt.priority} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p ? `${p.firstName} ${p.lastName}` : 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground truncate">{p?.mrn}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Set priority"
                      className="size-7 shrink-0 text-muted-foreground hover:text-amber-600"
                      onClick={() => setPriorityTarget(appt)}
                    >
                      <Flag className="size-3.5" />
                    </Button>
                    <StatusBadge status={appt.status} />
                  </div>
                );
              })}
            </div>
          )}
          {appointments.length > 12 && (
            <a href="/queue" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
              View full queue ({appointments.length}) <ArrowRight className="size-3" />
            </a>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Activity className="size-4 text-primary" /> Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <QuickAction label="Visit Records" subtitle="Past triage notes" href="/visits"
              icon={Stethoscope} color="text-blue-700" bgColor="bg-blue-50 hover:bg-blue-100" />
          </div>
        </CardContent>
      </Card>

      {/* Triage / Vitals Sheet */}
      <Sheet open={!!triagePatient} onOpenChange={(v) => { if (!v) closeTriage(); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">
              Triage — {patientName ? `${patientName.firstName} ${patientName.lastName}` : ''}
            </SheetTitle>
            <SheetDescription>
              {existingVitalsRecord ? 'Review or update vitals' : 'Record patient vitals before sending to doctor'}
            </SheetDescription>
          </SheetHeader>

          {triagePatient && (
            <form onSubmit={(e) => { e.preventDefault(); submitTriage(); }} className="space-y-4">
              {/* BMI Display */}
              {existingVitalsRecord?.bmi && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="py-3 flex items-center gap-3">
                    <Activity className="size-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">BMI</p>
                      <p className="text-lg font-bold">{existingVitalsRecord.bmi} <span className="text-xs font-normal text-muted-foreground">kg/m²</span></p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Priority Control */}
              <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
                <Label className="flex items-center gap-1"><Flag className="size-3" /> Queue Priority</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['routine', 'urgent', 'emergency'] as AppointmentPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTriagePriority(p)}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-xs font-semibold transition-colors',
                        triagePriority === p
                          ? p === 'emergency'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : p === 'urgent'
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-400 bg-white text-gray-700'
                          : 'border-gray-200 bg-white text-muted-foreground hover:border-gray-300',
                      )}
                    >
                      {t(`priority.${p}`)}
                    </button>
                  ))}
                </div>
                {triagePriority !== 'routine' && (
                  <Input
                    placeholder={t('priority.reasonPlaceholder')}
                    value={triagePriorityReason}
                    onChange={(e) => setTriagePriorityReason(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Activity className="size-3" /> Chief Complaint</Label>
                <Input placeholder="Reason for visit" value={vitalsForm.complaint}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, complaint: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1"><Thermometer className="size-3" /> Temperature (°C)</Label>
                  <Input placeholder="e.g. 37.2" value={vitalsForm.temp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temp: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1"><HeartPulse className="size-3" /> Pulse (bpm)</Label>
                  <Input placeholder="e.g. 72" value={vitalsForm.pulse}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1"><Activity className="size-3" /> Blood Pressure</Label>
                  <Input placeholder="e.g. 120/80" value={vitalsForm.bp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1"><Weight className="size-3" /> Weight (kg)</Label>
                  <Input placeholder="e.g. 70" value={vitalsForm.weight}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1"><Ruler className="size-3" /> Height (cm)</Label>
                  <Input placeholder="e.g. 170" value={vitalsForm.height}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, height: e.target.value })} />
                </div>
              </div>

              <SheetFooter className="pt-2 gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={closeTriage}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createVitalsMutation.isPending || updateVitalsMutation.isPending}>
                  {createVitalsMutation.isPending || updateVitalsMutation.isPending
                    ? 'Saving...'
                    : existingVitalsRecord ? 'Update Vitals' : 'Save Vitals'}
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* Priority Flag Dialog */}
      <PriorityDialog
        open={!!priorityTarget}
        onOpenChange={(o) => { if (!o) setPriorityTarget(null); }}
        appointment={priorityTarget}
        patientName={priorityTarget ? patientMap.get(priorityTarget.patientId)?.firstName : undefined}
        isSaving={priorityMutation.isPending}
        onSave={(priority, reason) => {
          if (!priorityTarget) return;
          priorityMutation.mutate({ id: priorityTarget.id, priority, reason });
        }}
      />
    </>
  );
}

/* ─── LAB TECH DASHBOARD ─── */
const LAB_STATUS_TABS: { value: LabOrderStatus; label: string; icon: React.ElementType }[] = [
  { value: 'ordered', label: 'Ordered', icon: Clock },
  { value: 'sample_collected', label: 'Sample Collected', icon: HeartPulse },
  { value: 'in_progress', label: 'In Progress', icon: FlaskConical },
  { value: 'completed', label: 'Completed', icon: ClipboardList },
];

function LabTechDashboard({ labOrders }: { labOrders: LabOrder[] }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<LabOrderStatus>('ordered');
  const [resultOrder, setResultOrder] = useState<LabOrder | null>(null);
  const [resultText, setResultText] = useState('');
  const [resultStatus, setResultStatus] = useState<LabOrderStatus>('completed');

  const groups = useMemo(() => {
    const map: Record<LabOrderStatus, LabOrder[]> = {
      ordered: [], sample_collected: [], in_progress: [], completed: [], cancelled: [],
    };
    for (const o of labOrders) {
      if (map[o.status]) map[o.status].push(o);
    }
    return map;
  }, [labOrders]);

  const collectMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/lab-orders/${id}`, { status: 'sample_collected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
      toast.success('Sample collected');
    },
    onError: () => toast.error('Failed to update lab order'),
  });

  const resultMutation = useMutation({
    mutationFn: ({ id, resultText, status }: { id: string; resultText: string; status: LabOrderStatus }) =>
      api.patch(`/lab-orders/${id}`, { resultText, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
      setResultOrder(null);
      setResultText('');
      setResultStatus('completed');
      toast.success('Results saved');
    },
    onError: () => toast.error('Failed to save results'),
  });

  const openResults = (o: LabOrder) => {
    setResultOrder(o);
    setResultText(o.resultText || '');
    setResultStatus('completed');
  };

  const pendingCount = groups.ordered.length + groups.sample_collected.length + groups.in_progress.length;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Pending Tests" value={pendingCount} icon={FlaskConical}
          color="bg-gradient-to-br from-amber-500 to-orange-500" description="Awaiting processing" />
      </div>

      <Card>
        <CardContent className="pt-5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as LabOrderStatus)}>
            <TabsList className="grid grid-cols-2 sm:grid-cols-4">
              {LAB_STATUS_TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <TabsTrigger key={t.value} value={t.value}>
                    <Icon className="size-3.5 mr-1.5" />
                    {t.label} ({groups[t.value].length})
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {LAB_STATUS_TABS.map((t) => (
              <TabsContent key={t.value} value={t.value} className="mt-4 space-y-2">
                {groups[t.value].length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No {t.label.toLowerCase()} tests
                  </div>
                ) : (
                  groups[t.value].slice(0, 12).map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{o.testType}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </p>
                        <LabOrderPatientInfo order={o} />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={o.status} />
                        {o.status === 'ordered' && (
                          <Button size="sm" variant="outline"
                            disabled={collectMutation.isPending}
                            onClick={() => collectMutation.mutate(o.id)} className="gap-1.5">
                            <Syringe className="size-3.5" /> Collect sample
                          </Button>
                        )}
                        {(o.status === 'sample_collected' || o.status === 'in_progress') && (
                          <Button size="sm" variant="outline" onClick={() => openResults(o)} className="gap-1.5">
                            <ClipboardList className="size-3.5" /> Enter results
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!resultOrder} onOpenChange={(o) => !o && setResultOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Results</DialogTitle>
            <DialogDescription>
              {resultOrder?.testType}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (resultOrder) {
                resultMutation.mutate({
                  id: resultOrder.id,
                  resultText,
                  status: resultStatus,
                });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Result</Label>
              <Textarea
                rows={4}
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                placeholder="Enter test results..."
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={resultStatus} onValueChange={(v) => setResultStatus(v as LabOrderStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setResultOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={resultMutation.isPending || !resultText.trim()}>
                {resultMutation.isPending ? 'Saving...' : 'Save Results'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── CASHIER DASHBOARD ─── */
function CashierDashboard({ invoices }: { invoices: Invoice[] }) {
  const pending = invoices.filter((i) => i.status === 'pending' || i.status === 'partial');
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Pending Invoices" value={pending.length} icon={Receipt}
          color="bg-gradient-to-br from-emerald-500 to-teal-500" description="Awaiting payment" />
        <StatCard title="Paid Today" value={invoices.filter((i) => i.status === 'paid').length} icon={Receipt}
          color="bg-gradient-to-br from-green-500 to-emerald-500" description="Completed payments" />
      </div>
      <Card>
        <CardContent className="pt-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Activity className="size-4 text-primary" /> Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <QuickAction label="Invoices" subtitle="Process payments" href="/invoices"
              icon={Receipt} color="text-emerald-700" bgColor="bg-emerald-50 hover:bg-emerald-100" />
          </div>
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Receipt className="size-4 text-emerald-500" /> Pending Invoices
            </h3>
            <div className="space-y-2">
              {pending.slice(0, 10).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">#{inv.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">${inv.totalAmount}</p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

/* ─── ADMIN DASHBOARD ─── */
function AdminDashboard({ appointments, patients, pendingLabOrders, doctors }: {
  appointments: Appointment[]; patients: Patient[]; pendingLabOrders: LabOrder[]; doctors: User[];
}) {
  const navigate = useNavigate();

  const { data: bookingRequests } = useQuery<BookingRequest[]>({
    queryKey: ['booking-requests'],
    queryFn: () => api.get('/booking/requests').then((r) => r.data).catch(() => []),
  });

  const { data: billing } = useQuery<{ collected: number; outstanding: number; unpaidInvoices: number }>({
    queryKey: ['analytics-billing-summary', '30d'],
    queryFn: () => api.get('/analytics/billing-summary?range=30d').then((r) => r.data).catch(() => ({ collected: 0, outstanding: 0, unpaidInvoices: 0 })),
  });

  const { data: diagnosesData } = useQuery<{ diagnoses: { code: string; description: string; count: number }[] }>({
    queryKey: ['analytics-diagnoses'],
    queryFn: () => api.get('/analytics/diagnoses').then((r) => r.data).catch(() => ({ diagnoses: [] })),
  });

  const pendingRequests = (bookingRequests || []).filter((r) => r.status === 'pending');
  const pendingLabCount = pendingLabOrders.filter((o) => o.status === 'ordered' || o.status === 'sample_collected').length;
  const highPriorityCount = appointments.filter((a) => a.priority === 'urgent' || a.priority === 'emergency').length;
  const unpaidInvoices = billing?.unpaidInvoices ?? 0;
  const outstanding = billing?.outstanding ?? 0;

  const attentionItems = [
    highPriorityCount > 0 && {
      key: 'priority',
      label: `${highPriorityCount} urgent/emergency in queue`,
      subtitle: 'Patients flagged as urgent or emergency',
      href: '/queue',
      icon: Flag,
      color: 'text-red-700',
      bgColor: 'bg-red-100',
    },
    pendingLabCount > 0 && {
      key: 'labs',
      label: `${pendingLabCount} pending lab orders`,
      subtitle: 'Ordered / awaiting sample collection',
      href: '/lab-orders?filter=pending',
      icon: FlaskConical,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
    },
    pendingRequests.length > 0 && {
      key: 'requests',
      label: `${pendingRequests.length} pending booking requests`,
      subtitle: 'Online booking requests to review',
      href: '/booking-requests',
      icon: Inbox,
      color: 'text-violet-700',
      bgColor: 'bg-violet-100',
    },
    unpaidInvoices > 0 && {
      key: 'invoices',
      label: `${unpaidInvoices} unpaid invoice${unpaidInvoices === 1 ? '' : 's'}`,
      subtitle: `$${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding`,
      href: '/invoices',
      icon: Receipt,
      color: 'text-rose-700',
      bgColor: 'bg-rose-100',
    },
  ].filter(Boolean) as { key: string; label: string; subtitle: string; href: string; icon: React.ElementType; color: string; bgColor: string }[];

  const topDiagnoses = (diagnosesData?.diagnoses || []).slice(0, 5);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Patients" value={patients.length} icon={Users}
          color="bg-gradient-to-br from-teal-500 to-cyan-500"
          onClick={() => navigate('/patients')} />
        <StatCard title="Today's Queue" value={appointments.length} icon={ClipboardList}
          color="bg-gradient-to-br from-blue-500 to-indigo-500"
          onClick={() => navigate('/queue')} />
        <StatCard title="Pending Lab Orders" value={pendingLabCount} icon={FlaskConical}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
          onClick={() => navigate('/lab-orders?filter=pending')} />
        <StatCard title="Doctors" value={doctors.length} icon={Stethoscope}
          color="bg-gradient-to-br from-pink-500 to-rose-500"
          onClick={() => navigate('/users?role=doctor')} />
      </div>

      {attentionItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle className="size-4" />
              </div>
              <h3 className="font-semibold text-sm">Needs Attention ({attentionItems.length})</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
              {attentionItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigate(item.href)}
                  className="group flex items-center gap-3 rounded-xl border border-amber-200 bg-background p-3 text-left transition-colors hover:bg-amber-50"
                >
                  <div className={`flex items-center justify-center size-9 rounded-lg shrink-0 ${item.bgColor}`}>
                    <item.icon className={`size-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AdminClinicPerformance />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Stethoscope className="size-4 text-teal-500" /> Top Diagnoses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topDiagnoses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No diagnoses recorded in the last 90 days.</p>
          ) : (
            <div className="space-y-2">
              {topDiagnoses.map((d, i) => (
                <div key={d.code || i} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-sm font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.description || d.code}</p>
                    {d.description && d.code && (
                      <p className="text-xs text-muted-foreground font-mono truncate">{d.code}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">
                    {d.count}×
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
