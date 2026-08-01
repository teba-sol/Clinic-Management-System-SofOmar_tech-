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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Package, Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { Service } from '@/types';

const CATEGORIES = ['consultation', 'lab', 'radiology', 'procedure', 'medication', 'other'];

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then((r) => r.data).catch(() => []),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/services', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowCreate(false);
      toast.success('Service created');
    },
    onError: () => toast.error('Failed to create service'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setEditing(null);
      toast.success('Service updated');
    },
    onError: () => toast.error('Failed to update service'),
  });

  if (isLoading) return <LoadingPage />;

  return (
    <div>
      <PageHeader
        title="Services & Fees"
        description="Manage the service catalog and default prices"
        action={
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="size-4" /> Add Service
          </Button>
        }
      />

      {!services?.length ? (
        <EmptyState icon={Package} title="No services yet" description="Add services and fees to the catalog" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} className={`hover:shadow-md transition-shadow ${!s.active ? 'opacity-50' : ''}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{s.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${s.defaultPrice}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditing(s)}>
                    <Pencil className="size-3" /> Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
          <ServiceForm onSubmit={(data) => createMutation.mutate(data)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Service</DialogTitle></DialogHeader>
          {editing && (
            <ServiceForm
              initial={editing}
              onSubmit={(data) => updateMutation.mutate({ id: editing.id, data })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServiceForm({ initial, onSubmit, loading }: {
  initial?: Service;
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [category, setCategory] = useState(initial?.category || 'consultation');
  const [defaultPrice, setDefaultPrice] = useState(initial?.defaultPrice || '');
  const [active, setActive] = useState(initial?.active ?? true);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, category, defaultPrice: Number(defaultPrice), active }); }} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Service Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Complete Blood Count" required />
      </div>
      <div className="space-y-1.5">
        <Label>Category *</Label>
        <Select value={category} onValueChange={(v: string | null) => setCategory(v ?? "consultation")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Default Price ($) *</Label>
        <Input type="number" min={0} step={0.01} value={defaultPrice} onChange={(e) => setDefaultPrice(e.target.value)} placeholder="0.00" required />
      </div>
      {initial && (
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={String(active)} onValueChange={(v: string | null) => setActive(v === 'true')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <DialogFooter>
        <Button type="submit" disabled={loading || !name || !defaultPrice}>
          {loading ? 'Saving...' : initial ? 'Update Service' : 'Add Service'}
        </Button>
      </DialogFooter>
    </form>
  );
}
