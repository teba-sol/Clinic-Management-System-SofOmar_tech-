import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Stethoscope, ExternalLink, Search } from 'lucide-react';
import type { Visit, Patient } from '@/types';

export default function VisitsPage() {
  const [search, setSearch] = useState('');

  const { data: visits, isLoading } = useQuery<Visit[]>({
    queryKey: ['visits'],
    queryFn: () => api.get('/visits').then((r) => r.data).catch(() => []),
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data).catch(() => []),
  });

  const patientMap = useMemo(() => new Map((patients || []).map((p) => [p.id, p])), [patients]);

  const filteredVisits = useMemo(() => {
    if (!visits) return [];
    if (!search.trim()) return visits;
    const q = search.toLowerCase();
    return visits.filter((v) => {
      const p = patientMap.get(v.patientId);
      if (!p) return false;
      return (
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q)
      );
    });
  }, [visits, search, patientMap]);

  if (isLoading) return <LoadingPage />;

  return (
    <div>
      <PageHeader
        title="Visits"
        description="Patient visit records with SOAP notes"
      />

      {visits && visits.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or MRN..."
            className="pl-9 h-9"
          />
        </div>
      )}

      {!filteredVisits.length ? (
        <EmptyState
          icon={Stethoscope}
          title={search ? 'No matching visits' : 'No visits recorded'}
          description={
            search
              ? 'No visits match your search. Try a different name or MRN.'
              : 'Start a visit from the queue to begin recording SOAP notes'
          }
        >
          {!search && (
            <a href="/queue">
              <Button variant="outline" size="sm" className="gap-1.5 mt-2">
                <ExternalLink className="size-3.5" />
                Go to Queue
              </Button>
            </a>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          {filteredVisits.map((visit) => {
            const p = patientMap.get(visit.patientId);
            return (
            <Card key={visit.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(visit.createdAt).toLocaleDateString()} — Patient: {p ? `${p.firstName} ${p.lastName} (${p.mrn})` : visit.patientId}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {visit.subjective && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Subjective</p>
                      <p className="text-sm mt-0.5">{visit.subjective}</p>
                    </div>
                  )}
                  {visit.objective && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Objective</p>
                      <p className="text-sm mt-0.5">{visit.objective}</p>
                    </div>
                  )}
                  {visit.assessment && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Assessment</p>
                      <p className="text-sm mt-0.5">{visit.assessment}</p>
                    </div>
                  )}
                  {visit.plan && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Plan</p>
                      <p className="text-sm mt-0.5">{visit.plan}</p>
                    </div>
                  )}
                </div>
                {visit.diagnosisDescription && (
                  <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs font-medium text-primary">Diagnosis: {visit.diagnosisDescription}</p>
                    {visit.diagnosisCode && (
                      <p className="text-xs text-muted-foreground">Code: {visit.diagnosisCode}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
