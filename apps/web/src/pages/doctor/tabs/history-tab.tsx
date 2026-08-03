import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { cachedGet } from '@/lib/offline-queue';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Pill,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Download,
  Plus,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Visit, Prescription, LabOrder, PrescriptionItem } from '@/types';

interface HistoryTabProps {
  patientId: string;
}

export function HistoryTab({ patientId }: HistoryTabProps) {
  const {
    data: visits,
    isLoading: visitsLoading,
  } = useQuery<Visit[]>({
    queryKey: ['patient-visits', patientId],
    queryFn: () =>
      cachedGet<Visit[]>(`/visits/patient/${patientId}`)
        .then((r) => r.data)
        .catch(() => []),
  });

  const {
    data: prescriptions,
    isLoading: rxLoading,
  } = useQuery<Prescription[]>({
    queryKey: ['patient-prescriptions', patientId],
    queryFn: () =>
      cachedGet<Prescription[]>(`/prescriptions/patient/${patientId}`)
        .then((r) => r.data)
        .catch(() => []),
  });

  const {
    data: labOrders,
    isLoading: labLoading,
  } = useQuery<LabOrder[]>({
    queryKey: ['patient-lab-orders', patientId],
    queryFn: () =>
      cachedGet<LabOrder[]>(`/lab-orders/patient/${patientId}`)
        .then((r) => r.data)
        .catch(() => []),
  });

  const allItems = [
    ...(visits || []).map((v) => ({
      type: 'visit' as const,
      data: v,
      date: v.createdAt,
    })),
    ...(prescriptions || []).map((p) => ({
      type: 'prescription' as const,
      data: p,
      date: p.createdAt,
    })),
    ...(labOrders || []).map((l) => ({
      type: 'lab_order' as const,
      data: l,
      date: l.createdAt,
    })),
  ].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const handleDownloadPdf = async (id: string) => {
    try {
      const res = await api.get(`/prescriptions/${id}/pdf`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  if (visitsLoading || rxLoading || labLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-40 mb-3" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No history recorded yet"
        description="Past visits, prescriptions, and lab orders will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {allItems.map((item, idx) => (
        <HistoryCard
          key={`${item.type}-${item.data.id}-${idx}`}
          item={item}
          onDownloadPdf={handleDownloadPdf}
        />
      ))}
    </div>
  );
}

function HistoryCard({
  item,
  onDownloadPdf,
}: {
  item:
    | { type: 'visit'; data: Visit; date: string }
    | { type: 'prescription'; data: Prescription; date: string }
    | { type: 'lab_order'; data: LabOrder; date: string };
  onDownloadPdf: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAddendum, setShowAddendum] = useState(false);
  const [addendumText, setAddendumText] = useState('');
  const queryClient = useQueryClient();

  const addendumMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/visits/${item.data.id}`, {
        addendum: addendumText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['patient-visits'],
      });
      toast.success('Addendum saved');
      setShowAddendum(false);
      setAddendumText('');
    },
    onError: () => toast.error('Failed to save addendum'),
  });

  if (item.type === 'visit') {
    const v = item.data;
    return (
      <Card>
        <CardContent className="pt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold">Visit — SOAP Notes</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(v.createdAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            {expanded ? (
              <ChevronUp className="size-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground shrink-0" />
            )}
          </button>
          {expanded && (
            <div className="mt-3 space-y-3 border-t pt-3">
              {v.subjective && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Subjective
                  </p>
                  <p className="text-sm mt-0.5">{v.subjective}</p>
                </div>
              )}
              {v.objective && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Objective
                  </p>
                  <p className="text-sm mt-0.5">{v.objective}</p>
                </div>
              )}
              {v.assessment && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Assessment
                  </p>
                  <p className="text-sm mt-0.5">{v.assessment}</p>
                </div>
              )}
              {v.plan && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Plan
                  </p>
                  <p className="text-sm mt-0.5">{v.plan}</p>
                </div>
              )}
              {(v.diagnosisCode || v.diagnosisDescription) && (
                <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                  {v.diagnosisDescription && (
                    <p className="text-xs font-medium text-primary">
                      {v.diagnosisDescription}
                    </p>
                  )}
                  {v.diagnosisCode && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ICD-10: {v.diagnosisCode}
                    </p>
                  )}
                </div>
              )}
              {v.addendum && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs font-semibold text-amber-700 mb-1">
                    Addendum — {new Date(v.updatedAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-amber-900">{v.addendum}</p>
                </div>
              )}
              <div className="border-t pt-3">
                {!showAddendum ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddendum(true);
                    }}
                  >
                    <Plus className="size-3" />
                    Add Addendum
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      <span>
                        New addendum — {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <Textarea
                      value={addendumText}
                      onChange={(e) => setAddendumText(e.target.value)}
                      placeholder="Enter your addendum notes..."
                      rows={3}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          addendumMutation.mutate();
                        }}
                        disabled={
                          addendumMutation.isPending || !addendumText.trim()
                        }
                      >
                        {addendumMutation.isPending
                          ? 'Saving...'
                          : 'Save Addendum'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddendum(false);
                          setAddendumText('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (item.type === 'prescription') {
    const rx = item.data;
    return (
      <Card
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer"
      >
        <CardContent className="pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Pill className="size-4 text-pink-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Prescription</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(rx.createdAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  — {(rx.items as PrescriptionItem[]).length} medication
                  {(rx.items as PrescriptionItem[]).length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadPdf(rx.id);
                }}
              >
                <Download className="size-3" />
                PDF
              </Button>
              {expanded ? (
                <ChevronUp className="size-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground shrink-0" />
              )}
            </div>
          </div>
          {expanded && (
            <div className="mt-3 space-y-2 border-t pt-3">
              {(rx.items as PrescriptionItem[]).map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50"
                >
                  <span className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item.drugName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.dosage} | {item.frequency} | {item.route} |{' '}
                      {item.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (item.type === 'lab_order') {
    const lo = item.data;
    return (
      <Card>
        <CardContent className="pt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <FlaskConical className="size-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{lo.testType}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(lo.createdAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={lo.status} />
              {expanded ? (
                <ChevronUp className="size-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground shrink-0" />
              )}
            </div>
          </button>
          {expanded && lo.resultText && (
            <div className="mt-3 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Result
              </p>
              <p className="text-sm">{lo.resultText}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
