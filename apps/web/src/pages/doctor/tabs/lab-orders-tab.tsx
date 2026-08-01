import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { FlaskConical, Plus, AlertCircle, Beaker } from 'lucide-react';
import { toast } from 'sonner';
import type { LabOrder } from '@/types';

interface LabOrdersTabProps {
  patientId: string;
  visitId?: string;
  doctorId: string;
}

export function LabOrdersTab({
  patientId,
  visitId,
  doctorId,
}: LabOrdersTabProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [testType, setTestType] = useState('');

  const {
    data: labOrders,
    isLoading,
    isError,
  } = useQuery<LabOrder[]>({
    queryKey: ['patient-lab-orders', patientId],
    queryFn: () =>
      api
        .get(`/lab-orders/patient/${patientId}`)
        .then((r) => r.data)
        .catch(() => []),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/lab-orders', {
        ...(visitId ? { visitId } : {}),
        patientId,
        orderedByDoctorId: doctorId,
        testType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['patient-lab-orders', patientId],
      });
      setShowForm(false);
      setTestType('');
      toast.success('Lab order created');
    },
    onError: () => toast.error('Failed to create lab order'),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
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
            Could not load lab orders
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="gap-2"
          size="sm"
        >
          <Plus className="size-4" />
          New Lab Order
        </Button>
      )}

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Test Type *</Label>
                <Input
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  placeholder="e.g. Complete Blood Count, Chest X-Ray, Lipid Panel"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !testType.trim()}
                >
                  {createMutation.isPending ? 'Ordering...' : 'Order Test'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!labOrders?.length ? (
        <EmptyState
          icon={Beaker}
          title="No lab orders yet"
          description="Order lab tests for this patient"
        />
      ) : (
        <div className="space-y-3">
          {labOrders.map((lo) => (
            <Card key={lo.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
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
                  <StatusBadge status={lo.status} />
                </div>
                {lo.status === 'completed' && lo.resultText && (
                  <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">
                      Result
                    </p>
                    <p className="text-sm text-emerald-900">{lo.resultText}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
