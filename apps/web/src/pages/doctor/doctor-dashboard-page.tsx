import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { usePatientContext } from '@/context/patient-context';
import { useSocket, useLabResults } from '@/hooks/use-socket';
import { EmptyState } from '@/components/shared/empty-state';
import { PriorityDialog } from '@/components/appointments/priority-dialog';
import { getGreeting, getClinicToday } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QueueCard } from './components/queue-card';
import {
  ClipboardList,
  Clock,
  Play,
  Activity,
  Calendar,
  Wifi,
  WifiOff,
  AlertCircle,
  RotateCw,
  FlaskConical,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment, Patient, Visit } from '@/types';

interface AppointmentWithPatient extends Appointment {
  patient: Patient | null;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold mt-0.5 tracking-tight">{value}</p>
          </div>
          <div
            className={`flex items-center justify-center size-10 rounded-lg ${color}`}
          >
            <Icon className="size-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type FilterTab = 'waiting' | 'in_progress' | 'completed';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setPatient } = usePatientContext();
  const queryClient = useQueryClient();

  const [filterTab, setFilterTab] = useState<FilterTab>('waiting');
  const [priorityTarget, setPriorityTarget] = useState<Appointment | null>(null);

  const priorityMutation = useMutation({
    mutationFn: ({ id, priority, reason }: { id: string; priority: 'routine' | 'urgent' | 'emergency'; reason?: string }) =>
      api.patch(`/appointments/${id}/priority`, { priority, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
      setPriorityTarget(null);
      toast.success('Priority updated');
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to update priority')),
  });

  const { queue, connected } = useSocket(user?.id ?? null);
  const { labResults, lastLabResult, clearLabResults } = useLabResults();

  useEffect(() => {
    if (lastLabResult) {
      toast.info(`Lab result ready for ${lastLabResult.patientName}`);
    }
  }, [lastLabResult]);

  const { data: allVisits } = useQuery<Visit[]>({
    queryKey: ['all-visits'],
    queryFn: () => api.get('/visits').then((r) => r.data).catch(() => []),
  });

  const visitInfoMap = useMemo(() => {
    const map = new Map<string, { count: number; lastDate: string }>();
    if (!allVisits) return map;
    for (const v of allVisits) {
      const existing = map.get(v.patientId);
      if (existing) {
        existing.count++;
        if (new Date(v.createdAt) > new Date(existing.lastDate)) {
          existing.lastDate = v.createdAt;
        }
      } else {
        map.set(v.patientId, { count: 1, lastDate: v.createdAt });
      }
    }
    return map;
  }, [allVisits]);

  const {
    data: queueData,
    isLoading,
    isError,
    refetch,
  } = useQuery<AppointmentWithPatient[]>({
    queryKey: ['doctor-queue', user?.id],
    queryFn: () =>
      api
        .get(`/appointments/queue/${user?.id}/with-patients`)
        .then((r) => r.data),
    enabled: !!user?.id,
  });

  const displayQueue = useMemo(() => {
    const base =
      queue.length > 0
        ? queue.map((a: Appointment) => ({
            ...a,
            patient:
              (queueData || []).find((qd) => qd.id === a.id)?.patient || null,
          }))
        : queueData || [];

    return [...base].sort((a, b) => a.queueNumber - b.queueNumber);
  }, [queue, queueData]);

  const filteredQueue = useMemo(() => {
    switch (filterTab) {
      case 'waiting':
        return displayQueue.filter(
          (a) => a.status === 'booked' || a.status === 'checked_in' || a.status === 'triaged',
        );
      case 'in_progress':
        return displayQueue.filter((a) => a.status === 'in_progress');
      case 'completed':
        return displayQueue.filter((a) => a.status === 'completed');
      default:
        return displayQueue;
    }
  }, [displayQueue, filterTab]);

  const pendingCount = displayQueue.filter(
    (a) => a.status === 'booked' || a.status === 'checked_in' || a.status === 'triaged',
  ).length;
  const inProgressCount = displayQueue.filter(
    (a) => a.status === 'in_progress',
  ).length;
  const completedCount = displayQueue.filter(
    (a) => a.status === 'completed',
  ).length;

  const startVisitMutation = useMutation({
    mutationFn: async (appt: AppointmentWithPatient) => {
      await api.patch(`/appointments/${appt.id}/status`, {
        status: 'in_progress',
      });
      return appt;
    },
    onSuccess: (appt) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-queue', user?.id] });
      if (appt.patient) {
        setPatient(appt.patient);
        navigate(`/doctor/workspace/${appt.patient.id}`);
        toast.success(`Starting visit for ${appt.patient.firstName} ${appt.patient.lastName}`);
      }
    },
    onError: () => toast.error('Failed to start visit'),
  });

  const handleOpenWorkspace = (appt: AppointmentWithPatient) => {
    if (!appt.patient) {
      toast.error('Patient data not available');
      return;
    }
    setPatient(appt.patient);
    navigate(`/doctor/workspace/${appt.patient.id}`);
  };

  if (!user) return null;

  const greeting = getGreeting;

  const today = getClinicToday();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.55_0.17_175)] via-[oklch(0.50_0.15_175)] to-[oklch(0.48_0.13_180)] p-6 sm:p-8 text-white">
        <div className="absolute -top-16 -right-16 size-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-12 size-48 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="text-white/60 text-sm font-medium mb-1">{today}</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            {greeting()}, {user.name?.split(' ')[0] || 'Doctor'}
          </h1>
          <p className="text-white/60 text-sm">
            Here's your patient queue for today.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Total Today"
          value={displayQueue.length}
          icon={ClipboardList}
          color="bg-gradient-to-br from-blue-500 to-indigo-500"
        />
        <StatCard
          title="Waiting"
          value={pendingCount}
          icon={Clock}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          icon={Play}
          color="bg-gradient-to-br from-violet-500 to-purple-500"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={Activity}
          color="bg-gradient-to-br from-emerald-500 to-teal-500"
        />
      </div>

      <div className="flex items-center gap-2">
        {connected ? (
          <>
            <Wifi className="size-4 text-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">
              Connected — Live updates active
            </span>
          </>
        ) : (
          <>
            <WifiOff className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Connecting...</span>
          </>
        )}
        {displayQueue.length > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {displayQueue.length} patient
            {displayQueue.length !== 1 ? 's' : ''} today
          </span>
        )}
      </div>

      {labResults.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="size-4 text-primary" />
            <p className="text-xs font-semibold text-primary">Lab results ready</p>
            <button
              onClick={clearLabResults}
              className="ml-auto p-1 rounded hover:bg-primary/10 text-muted-foreground"
              aria-label="Dismiss lab result notifications"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            {labResults.slice(0, 3).map((r) => (
              <p key={r.labOrderId} className="text-xs text-muted-foreground">
                {r.patientName} — result available
              </p>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 pb-6 text-center">
            <AlertCircle className="size-8 text-destructive mx-auto mb-2" />
            <p className="text-sm font-medium text-destructive mb-1">
              Could not load queue
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <RotateCw className="size-3" />
              Retry
            </button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <>
          <Tabs
            value={filterTab}
            onValueChange={(v) => setFilterTab(v as FilterTab)}
            className="w-full"
          >
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="waiting" className="gap-1.5 shrink-0">
                <Clock className="size-3.5" />
                Waiting
                {pendingCount > 0 && (
                  <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="gap-1.5 shrink-0">
                <Play className="size-3.5" />
                In Progress
                {inProgressCount > 0 && (
                  <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                    {inProgressCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-1.5 shrink-0">
                <Activity className="size-3.5" />
                Completed Today
                {completedCount > 0 && (
                  <span className="ml-1 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                    {completedCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredQueue.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No patients in this view"
              description={
                filterTab === 'waiting'
                  ? 'No patients waiting. Booked or checked-in patients will appear here.'
                  : filterTab === 'in_progress'
                  ? 'No active visits. Click "Start Visit" on a waiting patient to begin.'
                  : 'No completed visits today.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredQueue.map((appt) => {
                const vi = appt.patient ? visitInfoMap.get(appt.patient.id) : undefined;
                return (
                  <QueueCard
                    key={appt.id}
                    appointment={appt}
                    patient={appt.patient || undefined}
                    visitCount={vi?.count ?? 0}
                    lastVisitDate={vi?.lastDate ?? null}
                    onStartVisit={
                      appt.status === 'checked_in' || appt.status === 'triaged'
                        ? (a) => startVisitMutation.mutate(a as AppointmentWithPatient)
                        : undefined
                    }
                    onContinue={
                      appt.status === 'in_progress'
                        ? (a) => handleOpenWorkspace(a as AppointmentWithPatient)
                        : undefined
                    }
                    onView={
                      appt.status === 'completed'
                        ? (a) => handleOpenWorkspace(a as AppointmentWithPatient)
                        : undefined
                    }
                    onSetPriority={setPriorityTarget}
                    isPending={startVisitMutation.isPending}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      <PriorityDialog
        open={!!priorityTarget}
        onOpenChange={(o) => { if (!o) setPriorityTarget(null); }}
        appointment={priorityTarget}
        patientName={priorityTarget ? queueData?.find((a) => a.id === priorityTarget.id)?.patient?.firstName : undefined}
        isSaving={priorityMutation.isPending}
        onSave={(priority, reason) => {
          if (!priorityTarget) return;
          priorityMutation.mutate({ id: priorityTarget.id, priority, reason });
        }}
      />
    </div>
  );
}
