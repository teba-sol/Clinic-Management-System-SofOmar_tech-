import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useOffline } from '@/context/offline-context';
import { enqueue } from '@/lib/offline-queue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, FileCheck, AlertCircle, Clock, Stethoscope, HeartPulse, Thermometer, Weight, Ruler, Activity, RotateCw, Search, Check, ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Visit, Vital, DiagnosisCode } from '@/types';

interface NewVisitTabProps {
  patientId: string;
  appointmentId?: string;
  doctorId: string;
}

export function NewVisitTab({
  patientId,
  appointmentId,
  doctorId,
}: NewVisitTabProps) {
  const queryClient = useQueryClient();
  const { isOnline, lastSyncAt, refreshPendingCount } = useOffline();
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [diagnosisCode, setDiagnosisCode] = useState('');
  const [diagnosisDescription, setDiagnosisDescription] = useState('');

  const {
    data: existingVisit,
    isLoading,
    isError,
  } = useQuery<Visit | null>({
    queryKey: ['visit-by-appointment', appointmentId, patientId],
    queryFn: async () => {
      if (!appointmentId) return null;
      const visitsRes = await api
        .get(`/visits/patient/${patientId}`)
        .then((r) => r.data as Visit[])
        .catch(() => [] as Visit[]);
      const match = visitsRes.find(
        (v: Visit) => v.appointmentId === appointmentId,
      );
      return match || null;
    },
    enabled: !!appointmentId,
  });

  const { data: allPatientVisits } = useQuery<Visit[]>({
    queryKey: ['patient-visits', patientId],
    queryFn: () => api.get(`/visits/patient/${patientId}`).then((r) => r.data).catch(() => []),
    enabled: !!patientId,
  });

  const visitCount = allPatientVisits?.length ?? 0;
  const lastVisit = allPatientVisits && allPatientVisits.length > 0
    ? allPatientVisits.reduce((latest, v) =>
        new Date(v.createdAt) > new Date(latest.createdAt) ? v : latest
      )
    : null;
  const daysSinceLastVisit = lastVisit
    ? Math.floor((Date.now() - new Date(lastVisit.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isEditingToday =
    !!existingVisit &&
    new Date(existingVisit.createdAt).toDateString() === new Date().toDateString();
  const isPreviousDay =
    !!existingVisit &&
    new Date(existingVisit.createdAt).toDateString() !== new Date().toDateString();

  useEffect(() => {
    if (isEditingToday && existingVisit) {
      setSubjective(existingVisit.subjective || '');
      setObjective(existingVisit.objective || '');
      setAssessment(existingVisit.assessment || '');
      setPlan(existingVisit.plan || '');
      setDiagnosisCode(existingVisit.diagnosisCode || '');
      setDiagnosisDescription(existingVisit.diagnosisDescription || '');
    }
  }, [existingVisit, isEditingToday]);

  useEffect(() => {
    if (lastSyncAt) {
      queryClient.invalidateQueries({ queryKey: ['visit-by-appointment', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
      queryClient.invalidateQueries({ queryKey: ['patient-visits', patientId] });
    }
  }, [lastSyncAt, appointmentId, patientId, queryClient]);

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const notes = {
        subjective,
        objective,
        assessment,
        plan,
        diagnosisCode: diagnosisCode || undefined,
        diagnosisDescription: diagnosisDescription || undefined,
      };

      if (!isOnline) {
        if (isEditingToday) {
          await enqueue({
            id: crypto.randomUUID(),
            type: 'visit-update',
            method: 'PATCH',
            url: `/visits/${existingVisit!.id}`,
            payload: { ...notes, completeAppointment: false },
            createdAt: new Date().toISOString(),
          });
        } else {
          await enqueue({
            id: crypto.randomUUID(),
            type: 'visit-create',
            method: 'POST',
            url: '/visits',
            payload: { appointmentId, patientId, doctorId, ...notes, completeAppointment: false },
            createdAt: new Date().toISOString(),
          });
        }
        await refreshPendingCount();
        return { queued: true };
      }

      if (isEditingToday) {
        return api.patch(`/visits/${existingVisit!.id}`, notes);
      }
      return api.post('/visits', { appointmentId, patientId, doctorId, ...notes, completeAppointment: false });
    },
    onSuccess: (result) => {
      if (result && (result as { queued?: boolean }).queued) {
        toast.info('Draft saved offline — will sync automatically when you reconnect');
        return;
      }
      queryClient.invalidateQueries({
        queryKey: ['visit-by-appointment', appointmentId],
      });
      queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
      queryClient.invalidateQueries({ queryKey: ['patient-visits', patientId] });
      toast.success(isEditingToday ? 'Draft updated' : 'Draft saved');
    },
    onError: () => toast.error('Failed to save draft'),
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const notes = {
        subjective,
        objective,
        assessment,
        plan,
        diagnosisCode: diagnosisCode || undefined,
        diagnosisDescription: diagnosisDescription || undefined,
      };

      if (!isOnline) {
        if (isEditingToday) {
          await enqueue({
            id: crypto.randomUUID(),
            type: 'visit-update',
            method: 'PATCH',
            url: `/visits/${existingVisit!.id}`,
            payload: { ...notes, completeAppointment: true },
            createdAt: new Date().toISOString(),
          });
        } else {
          await enqueue({
            id: crypto.randomUUID(),
            type: 'visit-create',
            method: 'POST',
            url: '/visits',
            payload: { appointmentId, patientId, doctorId, ...notes, completeAppointment: true },
            createdAt: new Date().toISOString(),
          });
        }
        await refreshPendingCount();
        return { queued: true };
      }

      if (isEditingToday) {
        return api.patch(`/visits/${existingVisit!.id}`, {
          ...notes,
          completeAppointment: true,
        });
      }
      return api.post('/visits', { appointmentId, patientId, doctorId, ...notes, completeAppointment: true });
    },
    onSuccess: (result) => {
      if (result && (result as { queued?: boolean }).queued) {
        toast.info('Visit saved offline — will sync automatically when you reconnect');
        return;
      }
      queryClient.invalidateQueries({
        queryKey: ['visit-by-appointment', appointmentId],
      });
      queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
      queryClient.invalidateQueries({ queryKey: ['patient-visits', patientId] });
      toast.success('Visit completed');
    },
    onError: () => toast.error('Failed to complete visit'),
  });

  const isPending = saveDraftMutation.isPending || completeMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6 pb-6 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto mb-2" />
          <p className="text-sm font-medium text-destructive">
            Could not load visit data
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!appointmentId) {
    return (
      <Card className="border-muted">
        <CardContent className="pt-6 pb-6 text-center">
          <Stethoscope className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium mb-1">No Active Appointment</p>
          <p className="text-xs text-muted-foreground">
            A visit can only be created when the patient has an active
            appointment. Please call in a patient from the queue first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isPreviousDay && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4 flex items-start gap-2">
            <Clock className="size-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Previous Day Visit — Read Only
              </p>
              <p className="text-xs text-amber-700">
                This visit was recorded on{' '}
                {new Date(existingVisit!.createdAt).toLocaleDateString()}. The
                original notes are shown below for reference.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isPreviousDay && existingVisit && (
        <Card className="border-muted">
          <CardContent className="pt-4">
            <div className="space-y-3 opacity-70">
              {existingVisit.subjective && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Subjective</p>
                  <p className="text-sm mt-0.5">{existingVisit.subjective}</p>
                </div>
              )}
              {existingVisit.objective && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Objective</p>
                  <p className="text-sm mt-0.5">{existingVisit.objective}</p>
                </div>
              )}
              {existingVisit.assessment && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Assessment</p>
                  <p className="text-sm mt-0.5">{existingVisit.assessment}</p>
                </div>
              )}
              {existingVisit.plan && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Plan</p>
                  <p className="text-sm mt-0.5">{existingVisit.plan}</p>
                </div>
              )}
              {existingVisit.diagnosisDescription && (
                <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                  {existingVisit.diagnosisDescription && (
                    <p className="text-xs font-medium text-primary">{existingVisit.diagnosisDescription}</p>
                  )}
                  {existingVisit.diagnosisCode && (
                    <p className="text-xs text-muted-foreground mt-0.5">ICD-10: {existingVisit.diagnosisCode}</p>
                  )}
                </div>
              )}
              {!existingVisit.subjective && !existingVisit.objective && !existingVisit.assessment && !existingVisit.plan && !existingVisit.diagnosisDescription && (
                <p className="text-sm text-muted-foreground text-center py-4">No notes recorded for this visit.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!isEditingToday && visitCount === 0 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-3 pb-3 flex items-center gap-2">
            <Stethoscope className="size-4 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold text-emerald-800">New Patient — First Visit</p>
          </CardContent>
        </Card>
      )}

      {!isEditingToday && visitCount > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-3 pb-3 flex items-center gap-2">
            <Activity className="size-4 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">
                Follow-up Visit #{visitCount + 1}
              </p>
              <p className="text-xs text-blue-700">
                {daysSinceLastVisit !== null && daysSinceLastVisit <= 1
                  ? 'Seen yesterday'
                  : daysSinceLastVisit !== null
                  ? `Last visit was ${daysSinceLastVisit} days ago`
                  : 'Returning patient'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {appointmentId && (
        <VitalsCard appointmentId={appointmentId} />
      )}

      {(
        <>
          <div className="space-y-1.5">
            <Label>Subjective</Label>
            <Textarea
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              placeholder="Patient's reported symptoms, history of present illness..."
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Objective</Label>
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Vital signs, physical examination findings..."
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Assessment</Label>
            <Textarea
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              placeholder="Differential diagnosis, clinical reasoning..."
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="Treatment plan, follow-up instructions..."
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label>ICD-10 Diagnosis</Label>
            <DiagnosisCodeSearch
              code={diagnosisCode}
              description={diagnosisDescription}
              onSelect={(code, description) => {
                setDiagnosisCode(code);
                setDiagnosisDescription(description);
              }}
              onCodeChange={setDiagnosisCode}
              onDescriptionChange={setDiagnosisDescription}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={() => saveDraftMutation.mutate()}
              disabled={isPending}
              variant="outline"
              className="gap-2"
            >
              <Save className="size-4" />
              {saveDraftMutation.isPending ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              onClick={() => completeMutation.mutate()}
              disabled={isPending}
              className="gap-2"
            >
              <FileCheck className="size-4" />
              {completeMutation.isPending
                ? 'Completing...'
                : isEditingToday
                ? 'Save & Complete'
                : 'Save & Complete Visit'}
            </Button>
          </div>
        </>
      )}

      {appointmentId && (
        <SendBackSection appointmentId={appointmentId} />
      )}
    </div>
  );
}

function SendBackSection({ appointmentId }: { appointmentId: string }) {
  const queryClient = useQueryClient();
  const sendBackMutation = useMutation({
    mutationFn: () => api.patch(`/appointments/${appointmentId}/status`, { status: 'triaged' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-queue'] });
      toast.success('Patient sent back to nurse for re-triage');
    },
    onError: () => toast.error('Failed to send patient back'),
  });

  return (
    <div className="pt-2 border-t">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => sendBackMutation.mutate()}
        disabled={sendBackMutation.isPending}
      >
        <RotateCw className="size-3" />
        {sendBackMutation.isPending ? 'Sending...' : 'Send Back to Nurse'}
      </Button>
      <p className="text-xs text-muted-foreground mt-1">
        Re-assign patient to nurse for re-triage
      </p>
    </div>
  );
}

function DiagnosisCodeSearch({
  code,
  description,
  onSelect,
  onCodeChange,
  onDescriptionChange,
}: {
  code: string;
  description: string;
  onSelect: (code: string, description: string) => void;
  onCodeChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiagnosisCode[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { isFetching } = useQuery({
    queryKey: ['diagnosis-codes', 'search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) {
        setResults([]);
        return [];
      }
      const data = await api.get(`/diagnosis-codes/search?q=${encodeURIComponent(debouncedQuery)}`).then(r => r.data as DiagnosisCode[]);
      setResults(data);
      return data;
    },
    enabled: open && debouncedQuery.length > 0,
  });

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={code}
            onChange={(e) => {
              onCodeChange(e.target.value);
              if (!open) setOpen(true);
              setQuery(e.target.value);
            }}
            onFocus={() => {
              setOpen(true);
              if (code) setQuery(code);
            }}
            placeholder="Search ICD-10 code..."
            className="pr-8"
          />
          {code && (
            <button
              type="button"
              onClick={() => {
                onCodeChange('');
                onDescriptionChange('');
                setQuery('');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg ring-1 ring-foreground/10 overflow-hidden">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {isFetching ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">Searching...</div>
            ) : results.length === 0 && debouncedQuery.length > 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">No codes found</div>
            ) : results.length > 0 ? (
              results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.code, item.description);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors',
                    item.code === code && 'bg-accent font-medium',
                  )}
                >
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      item.code === code ? 'text-primary opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-xs">{item.code}</span>
                    <span className="ml-2">{item.description}</span>
                    {item.category && (
                      <span className="text-xs text-muted-foreground ml-1">({item.category})</span>
                    )}
                  </div>
                </button>
              ))
            ) : debouncedQuery.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Type at least 1 character to search
              </div>
            ) : null}
          </div>
        </div>
      )}

      <Input
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Diagnosis description (auto-filled on selection)"
        className="mt-2"
      />
    </div>
  );
}

function VitalsCard({ appointmentId }: { appointmentId: string }) {
  const { data: vitals, isLoading } = useQuery<Vital[]>({
    queryKey: ['vitals', 'appointment', appointmentId],
    queryFn: () => api.get(`/vitals/appointment/${appointmentId}`).then((r) => r.data),
    enabled: !!appointmentId,
  });

  const latest = vitals && vitals.length > 0 ? vitals[vitals.length - 1] : null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4 pb-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!latest) return null;

  return (
    <Card className="border-primary/10 bg-primary/[0.03]">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <HeartPulse className="size-3.5 text-primary" />
          Triage Vitals
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        {latest.chiefComplaint && (
          <div className="mb-3 p-2 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-xs font-medium text-amber-700">Chief Complaint</p>
            <p className="text-sm mt-0.5">{latest.chiefComplaint}</p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {latest.bloodPressure && (
            <div className="p-2 rounded-lg bg-card border">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">BP</p>
              <p className="text-sm font-semibold mt-0.5">{latest.bloodPressure}</p>
            </div>
          )}
          {latest.temperature && (
            <div className="p-2 rounded-lg bg-card border">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Temp</p>
              <p className="text-sm font-semibold mt-0.5">{latest.temperature} °C</p>
            </div>
          )}
          {latest.pulse && (
            <div className="p-2 rounded-lg bg-card border">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pulse</p>
              <p className="text-sm font-semibold mt-0.5">{latest.pulse} bpm</p>
            </div>
          )}
          {latest.bmi && (
            <div className="p-2 rounded-lg bg-card border">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">BMI</p>
              <p className="text-sm font-semibold mt-0.5">{latest.bmi} kg/m²</p>
            </div>
          )}
        </div>
        {(latest.weight || latest.height) && (
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {latest.weight && <span className="flex items-center gap-0.5"><Weight className="size-3" /> {latest.weight} kg</span>}
            {latest.height && <span className="flex items-center gap-0.5"><Ruler className="size-3" /> {latest.height} cm</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
