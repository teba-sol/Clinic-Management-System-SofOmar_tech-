import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { DoctorSchedule, User } from '@/types';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SchedulesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery<DoctorSchedule[]>({
    queryKey: ['schedules'],
    queryFn: () => api.get('/schedules').then((r) => r.data),
  });

  const { data: doctors } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data).catch(() => []),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/schedules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setShowCreate(false);
      toast.success('Schedule created');
    },
    onError: () => toast.error('Failed to create schedule'),
  });

  if (isLoading) return <LoadingPage />;

  const doctorList = (doctors || []).filter((d) => d.role === 'doctor');
  const doctorMap = new Map(doctorList.map((d) => [d.id, d.name]));

  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = (schedules || []).filter((s) => s.dayOfWeek === day);
    return acc;
  }, {} as Record<string, DoctorSchedule[]>);

  return (
    <div>
      <PageHeader
        title="Doctor Schedules"
        description="Manage weekly availability for doctors"
        action={
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="size-4" />
            Add Schedule
          </Button>
        }
      />

      {!schedules?.length ? (
        <EmptyState
          icon={Calendar}
          title="No schedules configured"
          description="Create a doctor's weekly schedule to get started"
          action={
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="size-4" />
              Add Schedule
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {DAYS.map((day) => (
            <Card key={day}>
              <CardContent className="pt-4">
                <h3 className="font-semibold capitalize text-sm mb-3 text-primary">{day}</h3>
                {grouped[day].length === 0 ? (
                  <p className="text-sm text-muted-foreground">No schedules</p>
                ) : (
                  <div className="grid gap-2">
                    {grouped[day].map((s) => (
                      <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="font-medium text-sm">{doctorMap.get(s.doctorId) || 'Doctor'}</div>
                        <div className="text-sm text-muted-foreground">
                          {s.startTime} — {s.endTime}
                        </div>
                        <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          {s.slotDurationMinutes}min slots
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Schedule</DialogTitle>
          </DialogHeader>
          <ScheduleForm
            doctors={doctorList}
            onSubmit={(data) => createMutation.mutate(data)}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScheduleForm({
  doctors,
  onSubmit,
  loading,
}: {
  doctors: User[];
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [doctorId, setDoctorId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState('20');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes: parseInt(slotDuration),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Label>Day *</Label>
        <Select value={dayOfWeek} onValueChange={(v: string | null) => setDayOfWeek(v ?? "")}>
          <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
          <SelectContent>
            {DAYS.map((d) => (
              <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Start Time *</Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>End Time *</Label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Slot Duration (minutes)</Label>
        <Input type="number" min={5} value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading || !doctorId || !dayOfWeek}>
          {loading ? 'Creating...' : 'Create Schedule'}
        </Button>
      </DialogFooter>
    </form>
  );
}
