import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { usePatientContext } from '@/context/patient-context';
import { useSocket } from '@/hooks/use-socket';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ClipboardList, Wifi, WifiOff, Users, Stethoscope, ArrowRight, Play, UserCheck, XCircle, Filter } from 'lucide-react';
import type { User, Appointment, Patient } from '@/types';

export default function QueuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { setPatient, setVisit } = usePatientContext();
  const isDoctor = user?.role === 'doctor';
  const isReceptionistOrNurse = user?.role === 'receptionist' || user?.role === 'nurse';

  const [selectedDoctor, setSelectedDoctor] = useState<string>(isDoctor ? (user?.id ?? '') : 'all');
  const filterParam = searchParams.get('filter') || 'all';

  const { data: doctors } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data).catch(() => []),
    enabled: user?.role === 'receptionist',
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data),
  });

  const patientMap = new Map(patients?.map((p) => [p.id, p]) ?? []);

  const { queue, connected } = useSocket(isDoctor ? (user?.id ?? null) : null);

  const { data: staticQueue } = useQuery<Appointment[]>({
    queryKey: ['queue', selectedDoctor],
    queryFn: () =>
      selectedDoctor === 'all'
        ? api.get('/appointments/queue').then((r) => r.data)
        : api.get(`/appointments/queue/${selectedDoctor}`).then((r) => r.data),
    enabled: !!selectedDoctor,
  });

  const displayQueue = queue.length > 0 ? queue : staticQueue;

  const filteredQueue = useMemo(() => {
    if (!displayQueue) return [];
    if (filterParam === 'booked') return displayQueue.filter((a) => a.status === 'booked');
    if (filterParam === 'checked_in') return displayQueue.filter((a) => a.status === 'checked_in');
    if (filterParam === 'in_progress') return displayQueue.filter((a) => a.status === 'in_progress');
    return displayQueue;
  }, [displayQueue, filterParam]);

  const clearFilter = () => {
    setSearchParams({});
  };

  const checkInMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/appointments/${id}/status`, { status: 'checked_in' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      toast.success('Patient checked in');
    },
    onError: () => toast.error('Failed to check in patient'),
  });

  const noShowMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/appointments/${id}/status`, { status: 'no_show' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      toast.success('Marked as no-show');
    },
    onError: () => toast.error('Failed to mark as no-show'),
  });

  const startVisitMutation = useMutation({
    mutationFn: async (appt: Appointment) => {
      const patient = patientMap.get(appt.patientId);
      if (!patient) throw new Error('Patient not found');
      const [res, _statusRes] = await Promise.all([
        api.post('/visits', {
          appointmentId: appt.id,
          patientId: appt.patientId,
          doctorId: appt.doctorId || user?.id,
        }),
        api.patch(`/appointments/${appt.id}/status`, { status: 'in_progress' }),
      ]);
      return { patient, visit: res.data };
    },
    onSuccess: ({ patient, visit }) => {
      setPatient(patient);
      setVisit(visit);
      navigate(`/patients/${patient.id}`);
      toast.success(`Started visit for ${patient.firstName} ${patient.lastName}`);
    },
    onError: () => toast.error('Failed to start visit'),
  });

  return (
    <div>
      <PageHeader
        title="Live Queue"
        description={isDoctor ? 'Your patient queue for today' : 'Check in patients and manage the queue'}
      />

      {!isDoctor && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Label>Select Doctor</Label>
              <Select value={selectedDoctor} onValueChange={(v: string | null) => setSelectedDoctor(v ?? "")}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Choose a doctor to view their queue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {(doctors || []).filter((d) => d.role === 'doctor').map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {isDoctor && filteredQueue && filteredQueue.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          {connected ? (
            <>
              <Wifi className="size-4 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">Connected — Live updates active</span>
            </>
          ) : (
            <>
              <WifiOff className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Connecting...</span>
            </>
          )}
        </div>
      )}

      {/* Filter indicator */}
      {filterParam !== 'all' && (
        <div className="flex items-center gap-2 mb-4">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium capitalize">
            Showing: {filterParam.replace('_', ' ')}
          </span>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilter}>
            Clear filter
          </Button>
        </div>
      )}

      {!selectedDoctor ? (
        <EmptyState
          icon={ClipboardList}
          title="Select a doctor"
          description="Choose a doctor above to view their live queue"
        />
      ) : !filteredQueue?.length ? (
        <EmptyState
          icon={Users}
          title="Queue is empty"
          description={filterParam !== 'all'
            ? `No ${filterParam.replace('_', ' ')} patients`
            : (selectedDoctor === 'all' ? 'No patients in queue today' : 'No patients in queue for this doctor')
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQueue.map((appt) => {
            const patient = patientMap.get(appt.patientId);
            return (
              <Card
                key={appt.id}
                className={`hover:shadow-lg transition-all duration-300 overflow-hidden ${
                  appt.status === 'in_progress'
                    ? 'ring-2 ring-amber-400 bg-amber-50/50'
                    : appt.status === 'completed'
                    ? 'opacity-60'
                    : ''
                }`}
              >
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center justify-center size-16 rounded-2xl text-2xl font-bold ${
                      appt.status === 'in_progress'
                        ? 'bg-amber-500 text-white animate-pulse'
                        : appt.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      #{appt.queueNumber}
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>

                  {patient && (
                    <p className="font-semibold text-sm truncate">
                      {patient.firstName} {patient.lastName}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    {patient && (
                      <>
                        <span className="font-mono">{patient.mrn}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>
                      {new Date(appt.scheduledAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    {user?.role === 'receptionist' && appt.status === 'booked' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={() => checkInMutation.mutate(appt.id)}
                          disabled={checkInMutation.isPending}
                        >
                          <UserCheck className="size-3.5" />
                          Check In
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => noShowMutation.mutate(appt.id)}
                          disabled={noShowMutation.isPending}
                        >
                          <XCircle className="size-3.5" />
                          No-show
                        </Button>
                      </>
                    )}
                    {user?.role === 'receptionist' && appt.status === 'checked_in' && (
                      <span className="flex-1 text-xs text-muted-foreground text-center py-1">Awaiting doctor</span>
                    )}
                    {isDoctor && (appt.status === 'checked_in' || appt.status === 'triaged') && (
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => startVisitMutation.mutate(appt)}
                        disabled={startVisitMutation.isPending}
                      >
                        <Play className="size-3.5" />
                        {startVisitMutation.isPending ? 'Starting...' : 'Start Visit'}
                      </Button>
                    )}
                    {isDoctor && appt.status === 'in_progress' && (
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => {
                          const p = patientMap.get(appt.patientId);
                          if (p) {
                            setPatient(p);
                            navigate(`/doctor/workspace/${p.id}`);
                          }
                        }}
                      >
                        <ArrowRight className="size-3.5" />
                        Continue
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        const p = patientMap.get(appt.patientId);
                        if (p) {
                          setPatient(p);
                          navigate(`/patients/${p.id}`);
                        } else {
                          navigate(`/patients/${appt.patientId}`);
                        }
                      }}
                    >
                      <Stethoscope className="size-3.5" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
