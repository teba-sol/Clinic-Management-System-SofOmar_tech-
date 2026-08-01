import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Pill, Plus, Trash2, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Prescription, PrescriptionItem } from '@/types';

interface PrescriptionsTabProps {
  patientId: string;
  visitId?: string;
  doctorId: string;
}

export function PrescriptionsTab({
  patientId,
  visitId,
  doctorId,
}: PrescriptionsTabProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState<PrescriptionItem[]>([
    { drugName: '', dosage: '', frequency: '', route: '', duration: '' },
  ]);

  const {
    data: prescriptions,
    isLoading,
    isError,
  } = useQuery<Prescription[]>({
    queryKey: ['patient-prescriptions', patientId],
    queryFn: () =>
      api
        .get(`/prescriptions/patient/${patientId}`)
        .then((r) => r.data)
        .catch(() => []),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/prescriptions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['patient-prescriptions', patientId],
      });
      setShowForm(false);
      setItems([
        {
          drugName: '',
          dosage: '',
          frequency: '',
          route: '',
          duration: '',
        },
      ]);
      toast.success('Prescription created');
    },
    onError: () => toast.error('Failed to create prescription'),
  });

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

  const addItem = () => {
    setItems([
      ...items,
      { drugName: '', dosage: '', frequency: '', route: '', duration: '' },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (
    index: number,
    field: keyof PrescriptionItem,
    value: string,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      patientId,
      ...(visitId ? { visitId } : {}),
      doctorId,
      items,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-10 w-full mt-3 rounded-lg" />
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
            Could not load prescriptions
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
          New Prescription
        </Button>
      )}

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Medications</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="gap-1"
                  >
                    <Plus className="size-3" />
                    Add Drug
                  </Button>
                </div>
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border space-y-3 bg-muted/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">
                        Drug {i + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(i)}
                          className="size-6 text-destructive"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Drug Name *</Label>
                        <Input
                          value={item.drugName}
                          onChange={(e) =>
                            updateItem(i, 'drugName', e.target.value)
                          }
                          placeholder="e.g. Amoxicillin"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Dosage *</Label>
                        <Input
                          value={item.dosage}
                          onChange={(e) =>
                            updateItem(i, 'dosage', e.target.value)
                          }
                          placeholder="e.g. 500mg"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Frequency *</Label>
                        <Input
                          value={item.frequency}
                          onChange={(e) =>
                            updateItem(i, 'frequency', e.target.value)
                          }
                          placeholder="e.g. 3x daily"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Route *</Label>
                        <Input
                          value={item.route}
                          onChange={(e) =>
                            updateItem(i, 'route', e.target.value)
                          }
                          placeholder="e.g. Oral"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Duration *</Label>
                      <Input
                        value={item.duration}
                        onChange={(e) =>
                          updateItem(i, 'duration', e.target.value)
                        }
                        placeholder="e.g. 7 days"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    items.some((i) => !i.drugName)
                  }
                >
                  {createMutation.isPending
                    ? 'Creating...'
                    : 'Create Prescription'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!prescriptions?.length ? (
        <EmptyState
          icon={Pill}
          title="No prescriptions yet"
          description="Create a prescription for this patient"
        />
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <Card key={rx.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold">Prescription</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(rx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleDownloadPdf(rx.id)}
                  >
                    <Download className="size-3.5" />
                    PDF
                  </Button>
                </div>
                <div className="space-y-2">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
