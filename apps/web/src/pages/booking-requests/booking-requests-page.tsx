import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { SearchSelect } from '@/components/shared/search-select';
import { toast } from 'sonner';
import {
  Phone, Mail, Clock, CalendarDays, CalendarCheck, Inbox, Loader2, ArrowRight, PhoneCall, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  BookingRequest, BookingRequestStatus, CreatePatientDto, Patient, User,
} from '@/types';

type Filter = 'all' | BookingRequestStatus;

const FILTERS: Filter[] = ['all', 'pending', 'contacted', 'converted', 'declined'];

const TIME_OF_DAY_START: Record<string, string> = {
  morning: '09:00',
  afternoon: '14:00',
  evening: '17:00',
};

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function BookingRequestsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('pending');
  const [convertTarget, setConvertTarget] = useState<BookingRequest | null>(null);

  const { data: requests, isLoading } = useQuery<BookingRequest[]>({
    queryKey: ['booking-requests'],
    queryFn: () => api.get('/booking/requests').then((r) => r.data).catch(() => []),
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data).catch(() => []),
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data).catch(() => []),
  });

  const doctors = useMemo(() => (users || []).filter((u) => u.role === 'doctor'), [users]);

  const filtered = useMemo(() => {
    if (!requests) return [];
    return filter === 'all' ? requests : requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingRequestStatus }) =>
      api.patch(`/booking/requests/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
      toast.success(t('bookingRequests.updated'));
    },
    onError: () => toast.error(t('bookingRequests.updateError')),
  });

  const convertMutation = useMutation({
    mutationFn: async ({
      request, patientId, newPatient, doctorId, scheduledAt,
    }: {
      request: BookingRequest;
      patientId?: string;
      newPatient?: CreatePatientDto;
      doctorId: string;
      scheduledAt: string;
    }) => {
      let resolvedPatientId = patientId;
      if (newPatient) {
        const res = await api.post('/patients', newPatient);
        resolvedPatientId = res.data.id;
      }
      const appt = await api.post('/appointments', {
        patientId: resolvedPatientId,
        doctorId,
        scheduledAt,
      });
      await api.patch(`/booking/requests/${request.id}/status`, { status: 'converted' });
      return appt.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-all'] });
      setConvertTarget(null);
      const qn = data?.queueNumber;
      toast.success(
        qn
          ? t('bookingRequests.convertedSuccess', { queue: qn })
          : t('bookingRequests.convertedSuccessNoQueue'),
      );
    },
    onError: () => toast.error(t('bookingRequests.convertError')),
  });

  const counts = useMemo(() => {
    const map: Record<Filter, number> = { all: requests?.length ?? 0, pending: 0, contacted: 0, converted: 0, declined: 0 };
    for (const r of requests || []) map[r.status] += 1;
    return map;
  }, [requests]);

  return (
    <div>
      <PageHeader
        title={t('bookingRequests.title')}
        description={t('bookingRequests.description')}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border p-1 bg-muted/30 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`bookingRequests.${f === 'all' ? 'all' : f}`)}
            <span className="text-muted-foreground/60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t('bookingRequests.emptyTitle')}
          description={t('bookingRequests.emptyDescription')}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onMarkContacted={() => statusMutation.mutate({ id: request.id, status: 'contacted' })}
              onDecline={() => statusMutation.mutate({ id: request.id, status: 'declined' })}
              onConvert={() => setConvertTarget(request)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!convertTarget} onOpenChange={(o) => { if (!o) setConvertTarget(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          {convertTarget && (
            <ConvertDialogContent
              request={convertTarget}
              patients={patients || []}
              doctors={doctors}
              loading={convertMutation.isPending}
              onClose={() => setConvertTarget(null)}
              onSubmit={(payload) =>
                convertMutation.mutate({ request: convertTarget, ...payload })
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestCard({
  request,
  onMarkContacted,
  onDecline,
  onConvert,
}: {
  request: BookingRequest;
  onMarkContacted: () => void;
  onDecline: () => void;
  onConvert: () => void;
}) {
  const { t } = useTranslation();

  const departmentLabel = request.department.startsWith('landing.')
    ? t(request.department)
    : request.department;

  const canAct = request.status === 'pending' || request.status === 'contacted';

  return (
    <div className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-foreground">{request.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('bookingRequests.submittedOn')}{' '}
            {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <StatusBadge status={request.status}>{t(`bookingRequests.${request.status}`)}</StatusBadge>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Phone className="size-4 shrink-0 text-brand-500" />
          <a href={`tel:${request.phone}`} className="font-medium text-brand-700 hover:underline">
            {request.phone}
          </a>
        </div>
        {request.email && (
          <div className="flex items-center gap-2">
            <Mail className="size-4 shrink-0 text-brand-500" />
            <span className="truncate">{request.email}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-brand-500" />
          <span>{formatDate(request.preferredDate)}</span>
          <span className="text-muted-foreground">·</span>
          <Clock className="size-4 shrink-0 text-brand-500" />
          <span>{t(`landing.quickBook.${request.preferredTime}`)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('bookingRequests.department')}
          </span>
          <span>{departmentLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('bookingRequests.doctor')}
          </span>
          <span>{request.doctorName || t('bookingRequests.anyDoctor')}</span>
        </div>
        {request.reason && (
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">{t('bookingRequests.reason')}: </span>
            {request.reason}
          </p>
        )}
      </div>

      {canAct && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
          {request.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={onMarkContacted}
              disabled={false}
            >
              <PhoneCall className="size-3" />
              {t('bookingRequests.markContacted')}
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={onConvert}
          >
            <CalendarCheck className="size-3" />
            {t('bookingRequests.convert')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
            onClick={onDecline}
          >
            <X className="size-3" />
            {t('bookingRequests.decline')}
          </Button>
        </div>
      )}
    </div>
  );
}

function ConvertDialogContent({
  request,
  patients,
  doctors,
  loading,
  onClose,
  onSubmit,
}: {
  request: BookingRequest;
  patients: Patient[];
  doctors: User[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    patientId?: string;
    newPatient?: CreatePatientDto;
    doctorId: string;
    scheduledAt: string;
  }) => void;
}) {
  const { t } = useTranslation();

  const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing');
  const [patientId, setPatientId] = useState('');
  const [firstName, setFirstName] = useState(request.name.split(' ')[0] || '');
  const [lastName, setLastName] = useState(request.name.split(' ').slice(1).join(' ') || '');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState(request.phone);
  const [email, setEmail] = useState(request.email || '');
  const [doctorId, setDoctorId] = useState(request.doctorId || '');
  const [scheduledAt, setScheduledAt] = useState(
    `${request.preferredDate}T${TIME_OF_DAY_START[request.preferredTime] || '09:00'}`,
  );

  const departmentLabel = request.department.startsWith('landing.')
    ? t(request.department)
    : request.department;

  const patientItems = useMemo(
    () =>
      patients.map((p) => ({
        value: p.id,
        label: `${p.firstName} ${p.lastName}`,
        subtitle: `${p.mrn} · ${p.phone}`,
      })),
    [patients],
  );

  const doctorItems = useMemo(
    () =>
      doctors.map((d) => ({
        value: d.id,
        label: `Dr. ${d.name}`,
        subtitle: (d as User & { specialty?: string }).specialty || 'General Practitioner',
      })),
    [doctors],
  );

  const newPatientValid =
    firstName.trim() && lastName.trim() && gender && dateOfBirth && phone.trim();
  const canSubmit =
    (patientMode === 'existing' ? !!patientId : !!newPatientValid) && !!doctorId && !!scheduledAt;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      patientId: patientMode === 'existing' ? patientId : undefined,
      newPatient:
        patientMode === 'new'
          ? {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              dateOfBirth,
              gender,
              phone: phone.trim(),
              email: email.trim() || undefined,
            }
          : undefined,
      doctorId,
      scheduledAt,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('bookingRequests.convertTitle')}</DialogTitle>
        <DialogDescription>{t('bookingRequests.convertDescription')}</DialogDescription>
      </DialogHeader>

      <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{request.name}</span>
          <a href={`tel:${request.phone}`} className="text-brand-700 hover:underline">{request.phone}</a>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {departmentLabel} · {formatDate(request.preferredDate)} ·{' '}
          {t(`landing.quickBook.${request.preferredTime}`)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="mb-2.5 flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('bookingRequests.patientSection')}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-1 w-fit">
            {(['existing', 'new'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPatientMode(mode)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  patientMode === mode ? 'bg-background shadow-sm' : 'text-muted-foreground',
                )}
              >
                {t(`bookingRequests.${mode === 'existing' ? 'existingPatient' : 'newPatient'}`)}
              </button>
            ))}
          </div>

          {patientMode === 'existing' ? (
            <div className="mt-3 space-y-1.5">
              <Label>{t('bookingRequests.selectPatient')} *</Label>
              <SearchSelect
                items={patientItems}
                value={patientId}
                onValueChange={setPatientId}
                placeholder={t('bookingRequests.selectPatient')}
              />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('bookingRequests.firstName')} *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t('bookingRequests.lastName')} *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t('bookingRequests.gender')} *</Label>
                <Select value={gender} onValueChange={(v) => v && setGender(v)}>
                  <SelectTrigger className="w-full" aria-label={t('bookingRequests.gender')}>
                    <SelectValue>
                      {(value) => (value ? t(`bookingRequests.gender_${value}`) : '')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {['male', 'female', 'other'].map((g) => (
                      <SelectItem key={g} value={g}>
                        {t(`bookingRequests.gender_${g}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('bookingRequests.dateOfBirth')} *</Label>
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t('bookingRequests.phone')} *</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t('bookingRequests.email')}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('bookingRequests.doctorSection')}
          </span>
          <div className="space-y-1.5">
            <Label>{t('bookingRequests.selectDoctor')} *</Label>
            <SearchSelect
              items={doctorItems}
              value={doctorId}
              onValueChange={setDoctorId}
              placeholder={t('bookingRequests.selectDoctor')}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('bookingRequests.dateTime')} *</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('bookingRequests.cancel')}
          </Button>
          <Button type="submit" disabled={!canSubmit || loading} className="gap-1.5">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            {loading ? t('bookingRequests.converting') : t('bookingRequests.confirmConvert')}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
