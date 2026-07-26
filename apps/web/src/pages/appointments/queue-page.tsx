import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useSocket } from '@/hooks/use-socket';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ClipboardList, Wifi, WifiOff, Users } from 'lucide-react';
import type { User, Appointment } from '@/types';

export default function QueuePage() {
  const { user } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState(user?.role === 'doctor' ? user.id : '');

  const { data: doctors } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data).catch(() => []),
    enabled: user?.role !== 'doctor',
  });

  const { queue, connected } = useSocket(selectedDoctor || null);

  const { data: staticQueue } = useQuery<Appointment[]>({
    queryKey: ['queue', selectedDoctor],
    queryFn: () => api.get(`/appointments/queue/${selectedDoctor}`).then((r) => r.data),
    enabled: !!selectedDoctor,
  });

  const displayQueue = queue.length > 0 ? queue : staticQueue;

  return (
    <div>
      <PageHeader
        title="Live Queue"
        description="Real-time patient queue for doctors"
      />

      {user?.role !== 'doctor' && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Label>Select Doctor</Label>
              <Select value={selectedDoctor} onValueChange={(v: string | null) => setSelectedDoctor(v ?? "")}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Choose a doctor to view their queue" />
                </SelectTrigger>
                <SelectContent>
                  {(doctors || []).filter((d) => d.role === 'doctor').map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDoctor && (
        <div className="flex items-center gap-2 mb-4">
          {connected ? (
            <>
              <Wifi className="size-4 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">Connected - Live updates active</span>
            </>
          ) : (
            <>
              <WifiOff className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Connecting...</span>
            </>
          )}
        </div>
      )}

      {!selectedDoctor ? (
        <EmptyState
          icon={ClipboardList}
          title="Select a doctor"
          description="Choose a doctor above to view their live queue"
        />
      ) : !displayQueue?.length ? (
        <EmptyState
          icon={Users}
          title="Queue is empty"
          description="No patients in queue for this doctor"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayQueue.map((appt) => (
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
                <p className="text-xs text-muted-foreground">
                  {new Date(appt.scheduledAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
