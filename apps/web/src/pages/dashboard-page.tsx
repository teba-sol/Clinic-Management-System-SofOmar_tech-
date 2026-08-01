import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { usePatientContext } from '@/context/patient-context';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchSelect } from '@/components/shared/search-select';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getGreeting } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription,
} from '@/components/ui/sheet';
import {
  Users, CalendarCheck, FlaskConical, Receipt, Stethoscope,
  ClipboardList, TrendingUp, Activity, CalendarPlus, Clock,
  ArrowRight, Play, UserPlus, Pill, HeartPulse, Thermometer, Package,
  Weight, Ruler, Phone, Mail, MapPin, AlertTriangle, UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Patient, Appointment, LabOrder, Invoice, User, Visit, Vital, CreateVitalDto, UpdateVitalDto } from '@/types';

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

  const { data: pendingLabOrders } = useQuery<LabOrder[]>({
    queryKey: ['lab-orders-pending'],
    queryFn: () => api.get('/lab-orders/pending').then((r) => r.data),
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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const userRole = user.role;

  return (
    <div className="space-y-6">
      {/* Hero Greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.55_0.17_175)] via-[oklch(0.50_0.15_175)] to-[oklch(0.48_0.13_180)] p-6 sm:p-8 text-white">
        <div className="absolute -top-16 -right-16 size-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-12 size-48 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="text-white/60 text-sm font-medium mb-1">{today}</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            {greeting()}, {user.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-white/60 text-sm">Here's what's happening at the clinic today.</p>
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
        <LabTechDashboard pendingLabOrders={pendingLabOrders || []} />
      )}
      {userRole === 'cashier' && (
        <CashierDashboard invoices={invoices || []} />
      )}
      {userRole === 'admin' && (
        <AdminDashboard
          appointments={appointments || []}
          patients={patients || []}
          pendingLabOrders={pendingLabOrders || []}
          invoices={invoices || []}
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
  const pending = appointments.filter((a) => a.status === 'checked_in' || a.status === 'triaged' || a.status === 'booked');
  const firstPending = pending[0];

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

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="My Queue" value={appointments.length} icon={ClipboardList}
          color="bg-gradient-to-br from-blue-500 to-indigo-500"
          description="Patients waiting today" />
        <StatCard title="Total Patients" value={patients.length} icon={Users}
          color="bg-gradient-to-br from-teal-500 to-cyan-500"
          description="Registered patients" />
        <StatCard title="Pending" value={pending.length} icon={Clock}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
          description="Awaiting consultation" />
      </div>

      {firstPending && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-12 rounded-xl bg-primary text-primary-foreground font-bold text-lg">
                #{firstPending.queueNumber}
              </div>
              <div>
                <p className="font-semibold">{patientMap.get(firstPending.patientId)?.firstName} {patientMap.get(firstPending.patientId)?.lastName}</p>
                <p className="text-xs text-muted-foreground">{patientMap.get(firstPending.patientId)?.mrn}</p>
              </div>
            </div>
            <Button size="lg" className="gap-2 px-6" onClick={() => startVisitMutation.mutate(firstPending)}>
              <Play className="size-4" /> Start Next Patient
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Activity className="size-4 text-primary" /> Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <QuickAction label="My Queue" subtitle="View waiting patients" href="/queue"
              icon={ClipboardList} color="text-violet-700" bgColor="bg-violet-50 hover:bg-violet-100" />
            <QuickAction label="My Visits" subtitle="SOAP notes" href="/visits"
              icon={Stethoscope} color="text-blue-700" bgColor="bg-blue-50 hover:bg-blue-100" />
            <QuickAction label="Prescriptions" subtitle="Write prescription" href="/prescriptions"
              icon={Pill} color="text-pink-700" bgColor="bg-pink-50 hover:bg-pink-100" />
            <QuickAction label="Lab Orders" subtitle="Order tests" href="/lab-orders"
              icon={FlaskConical} color="text-amber-700" bgColor="bg-amber-50 hover:bg-amber-100" />
          </div>
        </CardContent>
      </Card>

      <QueuePreview appointments={appointments} patientMap={patientMap} />
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
  const [bookScheduledAt, setBookScheduledAt] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Appointment | null>(null);
  const [fastCheckinOpen, setFastCheckinOpen] = useState(false);
  const [fastCheckinPatientId, setFastCheckinPatientId] = useState('');

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

  useEffect(() => {
    if (!bookScheduledAt) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setBookScheduledAt(now.toISOString().slice(0, 16));
    }
  }, []);

  const bookMutation = useMutation({
    mutationFn: () => api.post('/appointments', { patientId: bookPatientId, doctorId: bookDoctorId, scheduledAt: bookScheduledAt }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['appointments-queue'] });
      const qn = res.data?.queueNumber;
      setBookPatientId(''); setBookDoctorId('');
      const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setBookScheduledAt(now.toISOString().slice(0, 16));
      toast.success(qn ? `Appointment booked — Queue #${qn}` : 'Appointment booked');
    },
    onError: () => toast.error('Failed to book appointment'),
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/appointments/${id}/status`, { status: 'checked_in' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-queue'] });
      toast.success('Patient checked in');
    },
    onError: () => toast.error('Failed to check in patient'),
  });

  const pendingCount = useMemo(() => liveAppointments.filter((a) => a.status === 'booked').length, [liveAppointments]);

  const bookedAppointments = useMemo(() =>
    liveAppointments.filter((a) => a.status === 'booked').sort((a, b) => a.queueNumber - b.queueNumber),
    [liveAppointments],
  );

  const profilePatient = selectedProfile ? patientMap.get(selectedProfile.patientId) : null;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Today's Queue" value={liveAppointments.length} icon={ClipboardList}
          color="bg-gradient-to-br from-blue-500 to-indigo-500" description="Total appointments"
          onClick={() => navigate('/queue')} />
        <StatCard title="Total Patients" value={patients.length} icon={Users}
          color="bg-gradient-to-br from-teal-500 to-cyan-500" description="Registered patients"
          onClick={() => navigate('/patients')} />
        <StatCard title="Pending" value={pendingCount} icon={Clock}
          color="bg-gradient-to-br from-amber-500 to-orange-500" description="Awaiting check-in"
          onClick={() => navigate('/queue?filter=booked')} />
      </div>

      {/* Quick Book */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
              <CalendarPlus className="size-4" />
            </div>
            <h3 className="font-semibold text-sm">Quick Book Appointment</h3>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); bookMutation.mutate(); }} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Patient</Label>
              <SearchSelect
                items={patients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}`, subtitle: p.mrn }))}
                value={bookPatientId} onValueChange={setBookPatientId} placeholder="Select patient"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Doctor</Label>
              <SearchSelect
                items={doctors.map((d) => ({ value: d.id, label: `Dr. ${d.name}`, subtitle: (d as any).specialty || 'General Practitioner' }))}
                value={bookDoctorId} onValueChange={setBookDoctorId} placeholder="Select doctor"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date & Time</Label>
              <Input type="datetime-local" value={bookScheduledAt} onChange={(e) => setBookScheduledAt(e.target.value)} className="h-9" />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={bookMutation.isPending || !bookPatientId || !bookDoctorId || !bookScheduledAt}
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
            <div className="space-y-2">
              {liveAppointments.sort((a, b) => a.queueNumber - b.queueNumber).slice(0, 6).map((appt) => {
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
                    <StatusBadge status={appt.status} />
                    {appt.status === 'booked' && (
                      <Button
                        size="sm"
                        className="shrink-0"
                        onClick={(e) => { e.stopPropagation(); checkInMutation.mutate(appt.id); }}
                        disabled={checkInMutation.isPending}
                      >
                        Check In
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Activity className="size-4 text-primary" /> Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <QuickAction label="Register Patient" subtitle="New patient record" href="/patients"
              icon={UserPlus} color="text-teal-700" bgColor="bg-teal-50 hover:bg-teal-100" />
            <QuickAction label="Book Appointment" subtitle="Schedule visit" href="/appointments"
              icon={CalendarCheck} color="text-blue-700" bgColor="bg-blue-50 hover:bg-blue-100" />
            <QuickAction label="Check In Patient" subtitle="Fast check-in" href="#"
              icon={UserCheck} color="text-green-700" bgColor="bg-green-50 hover:bg-green-100"
              onClick={() => setFastCheckinOpen(true)} />
            <QuickAction label="View Queue" subtitle="Patient flow" href="/queue"
              icon={ClipboardList} color="text-violet-700" bgColor="bg-violet-50 hover:bg-violet-100" />
          </div>
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

      {/* Fast Check-in Dialog */}
      <Dialog open={fastCheckinOpen} onOpenChange={setFastCheckinOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Fast Check-in</DialogTitle>
            <DialogDescription>Select a patient to check in immediately</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Patient</Label>
              <SearchSelect
                items={bookedAppointments.map((a) => {
                  const p = patientMap.get(a.patientId);
                  return { value: a.id, label: p ? `${p.firstName} ${p.lastName}` : 'Unknown', subtitle: p?.mrn };
                })}
                value={fastCheckinPatientId} onValueChange={setFastCheckinPatientId}
                placeholder="Select booked patient"
              />
            </div>
            <Button
              className="w-full"
              disabled={!fastCheckinPatientId || checkInMutation.isPending}
              onClick={() => {
                if (fastCheckinPatientId) {
                  checkInMutation.mutate(fastCheckinPatientId, {
                    onSuccess: () => { setFastCheckinOpen(false); setFastCheckinPatientId(''); },
                  });
                }
              }}
            >
              {checkInMutation.isPending ? 'Checking in...' : 'Check In'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── NURSE DASHBOARD ─── */
function NurseDashboard({ appointments, patients }: { appointments: Appointment[]; patients: Patient[] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setPatient } = usePatientContext();
  const [triagePatient, setTriagePatient] = useState<Appointment | null>(null);
  const [vitalsForm, setVitalsForm] = useState({ bp: '', temp: '', pulse: '', weight: '', height: '', complaint: '' });
  const [existingVitalsRecord, setExistingVitalsRecord] = useState<Vital | null>(null);

  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const checkedIn = appointments.filter((a) => a.status === 'checked_in');
  const triaged = appointments.filter((a) => a.status === 'triaged');
  const inProgress = appointments.filter((a) => a.status === 'in_progress');

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
    const p = patientMap.get(appt.patientId);
    if (p) setPatient(p);
  };

  const closeTriage = () => {
    setTriagePatient(null);
    setExistingVitalsRecord(null);
    setVitalsForm({ bp: '', temp: '', pulse: '', weight: '', height: '', complaint: '' });
  };

  const submitTriage = () => {
    if (!triagePatient || !user) return;

    if (existingVitalsRecord) {
      updateVitalsMutation.mutate({
        id: existingVitalsRecord.id,
        data: {
          bloodPressure: vitalsForm.bp || undefined,
          temperature: vitalsForm.temp || undefined,
          pulse: vitalsForm.pulse || undefined,
          weight: vitalsForm.weight || undefined,
          height: vitalsForm.height || undefined,
          chiefComplaint: vitalsForm.complaint || undefined,
        },
      });
    } else {
      createVitalsMutation.mutate({
        appointmentId: triagePatient.id,
        patientId: triagePatient.patientId,
        recordedByNurseId: user.id,
        bloodPressure: vitalsForm.bp || undefined,
        temperature: vitalsForm.temp || undefined,
        pulse: vitalsForm.pulse || undefined,
        weight: vitalsForm.weight || undefined,
        height: vitalsForm.height || undefined,
        chiefComplaint: vitalsForm.complaint || undefined,
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

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Activity className="size-4 text-primary" /> Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <QuickAction label="Register Patient" subtitle="New patient record" href="/patients"
              icon={UserPlus} color="text-teal-700" bgColor="bg-teal-50 hover:bg-teal-100" />
            <QuickAction label="View Queue" subtitle="Full patient queue" href="/queue"
              icon={ClipboardList} color="text-violet-700" bgColor="bg-violet-50 hover:bg-violet-100" />
            <QuickAction label="Visit Records" subtitle="Past triage notes" href="/visits"
              icon={Stethoscope} color="text-blue-700" bgColor="bg-blue-50 hover:bg-blue-100" />
          </div>
        </CardContent>
      </Card>

      {/* Checked In (Ready for Triage) Section */}
      {checkedIn.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3 text-blue-600">
              <HeartPulse className="size-4" /> Checked In — Record Vitals ({checkedIn.length})
            </h3>
            <div className="space-y-2">
              {checkedIn.slice(0, 10).map((appt) => {
                const p = patientMap.get(appt.patientId);
                return (
                  <div key={appt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-sm font-bold text-muted-foreground shrink-0">#{appt.queueNumber}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{p ? `${p.firstName} ${p.lastName}` : 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p?.mrn} · {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => openTriage(appt)} className="shrink-0">
                      Record Vitals
                    </Button>
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
              {triaged.slice(0, 10).map((appt) => {
                const p = patientMap.get(appt.patientId);
                return (
                  <div key={appt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-sm font-bold text-muted-foreground shrink-0">#{appt.queueNumber}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{p ? `${p.firstName} ${p.lastName}` : 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p?.mrn} · {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
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

      {/* Queue Preview */}
      <QueuePreview appointments={appointments} patientMap={patientMap} />

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
    </>
  );
}

/* ─── LAB TECH DASHBOARD ─── */
function LabTechDashboard({ pendingLabOrders }: { pendingLabOrders: LabOrder[] }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Pending Tests" value={pendingLabOrders.length} icon={FlaskConical}
          color="bg-gradient-to-br from-amber-500 to-orange-500" description="Awaiting processing" />
      </div>
      <Card>
        <CardContent className="pt-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Activity className="size-4 text-primary" /> Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <QuickAction label="Lab Orders" subtitle="Process tests" href="/lab-orders"
              icon={FlaskConical} color="text-amber-700" bgColor="bg-amber-50 hover:bg-amber-100" />
          </div>
        </CardContent>
      </Card>

      {pendingLabOrders.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <FlaskConical className="size-4 text-amber-500" /> Pending Lab Orders
            </h3>
            <div className="space-y-2">
              {pendingLabOrders.slice(0, 10).map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">{o.testType}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
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
function AdminDashboard({ appointments, patients, pendingLabOrders, invoices, doctors }: {
  appointments: Appointment[]; patients: Patient[]; pendingLabOrders: LabOrder[]; invoices: Invoice[]; doctors: User[];
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Patients" value={patients.length} icon={Users}
          color="bg-gradient-to-br from-teal-500 to-cyan-500" />
        <StatCard title="Today's Queue" value={appointments.length} icon={ClipboardList}
          color="bg-gradient-to-br from-blue-500 to-indigo-500" />
        <StatCard title="Pending Lab Orders" value={pendingLabOrders.length} icon={FlaskConical}
          color="bg-gradient-to-br from-amber-500 to-orange-500" />
        <StatCard title="Doctors" value={doctors.length} icon={Stethoscope}
          color="bg-gradient-to-br from-pink-500 to-rose-500" />
      </div>
      <Card>
        <CardContent className="pt-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Activity className="size-4 text-primary" /> Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <QuickAction label="Patients" subtitle="Manage records" href="/patients"
              icon={Users} color="text-teal-700" bgColor="bg-teal-50 hover:bg-teal-100" />
            <QuickAction label="Appointments" subtitle="Schedule" href="/appointments"
              icon={CalendarCheck} color="text-blue-700" bgColor="bg-blue-50 hover:bg-blue-100" />
            <QuickAction label="Users" subtitle="Manage staff" href="/users"
              icon={UserPlus} color="text-purple-700" bgColor="bg-purple-50 hover:bg-purple-100" />
            <QuickAction label="Schedules" subtitle="Doctor availability" href="/schedules"
              icon={Stethoscope} color="text-pink-700" bgColor="bg-pink-50 hover:bg-pink-100" />
            <QuickAction label="Lab Orders" subtitle="View all" href="/lab-orders"
              icon={FlaskConical} color="text-amber-700" bgColor="bg-amber-50 hover:bg-amber-100" />
            <QuickAction label="Invoices" subtitle="Financial" href="/invoices"
              icon={Receipt} color="text-emerald-700" bgColor="bg-emerald-50 hover:bg-emerald-100" />
            <QuickAction label="Services" subtitle="Fee schedule" href="/services"
              icon={Package} color="text-orange-700" bgColor="bg-orange-50 hover:bg-orange-100" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/* ─── QUEUE PREVIEW (shared) ─── */
function QueuePreview({ appointments, patientMap }: {
  appointments: Appointment[]; patientMap: Map<string, Patient>;
}) {
  if (!appointments || appointments.length === 0) return null;
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <h3 className="font-semibold">Today's Queue</h3>
          </div>
          {appointments.length > 6 && (
            <a href="/queue" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              View all <ArrowRight className="size-3" />
            </a>
          )}
        </div>
        <div className="space-y-2">
          {appointments.slice(0, 6).map((appt) => {
            const patient = patientMap.get(appt.patientId);
            return (
              <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
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
                <StatusBadge status={appt.status} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
