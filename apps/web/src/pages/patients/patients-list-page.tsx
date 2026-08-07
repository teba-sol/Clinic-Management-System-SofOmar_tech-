import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Search, Users, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import type { Patient, Visit } from '@/types';
import type { CreatePatientDto } from '@/types';

type SortKey = 'name' | 'mrn' | 'phone' | 'lastVisit';
type SortDir = 'asc' | 'desc';

export default function PatientsListPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data),
  });

  const { data: allVisits } = useQuery<Visit[]>({
    queryKey: ['all-visits'],
    queryFn: () => api.get('/visits').then((r) => r.data).catch(() => []),
  });

  const lastVisitMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!allVisits) return map;
    for (const v of allVisits) {
      const existing = map.get(v.patientId);
      if (!existing || new Date(v.createdAt) > new Date(existing)) {
        map.set(v.patientId, v.createdAt);
      }
    }
    return map;
  }, [allVisits]);

  const createMutation = useMutation({
    mutationFn: (data: CreatePatientDto) => api.post('/patients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setShowCreate(false);
      toast.success('Patient registered successfully');
    },
    onError: () => toast.error('Failed to register patient'),
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="size-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="size-3 ml-1" /> : <ArrowDown className="size-3 ml-1" />;
  };

  const filtered = useMemo(() => {
    if (!patients) return [];
    const q = search.toLowerCase();
    const filtered_list = patients.filter((p) => (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.phone.includes(q)
    ));
    filtered_list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'mrn':
          cmp = a.mrn.localeCompare(b.mrn);
          break;
        case 'phone':
          cmp = (a.phone || '').localeCompare(b.phone || '');
          break;
        case 'lastVisit': {
          const da = lastVisitMap.get(a.id);
          const db = lastVisitMap.get(b.id);
          if (!da && !db) cmp = 0;
          else if (!da) cmp = 1;
          else if (!db) cmp = -1;
          else cmp = new Date(da).getTime() - new Date(db).getTime();
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return filtered_list;
  }, [patients, search, sortKey, sortDir, lastVisitMap]);

  if (isLoading) return <LoadingPage />;

  const canCreate = ['admin', 'receptionist', 'nurse'].includes(user?.role || '');

  return (
    <div>
      <PageHeader
        title="Patients"
        description={`${patients?.length ?? 0} registered patients`}
        action={
          canCreate ? (
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <UserPlus className="size-4" />
              Register Patient
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, MRN, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </CardContent>
      </Card>

      {!filtered?.length ? (
        <EmptyState
          icon={Users}
          title="No patients found"
          description={search ? 'Try adjusting your search terms' : 'Register your first patient to get started'}
          action={
            !search && canCreate ? (
              <Button onClick={() => setShowCreate(true)}>
                <UserPlus className="size-4 mr-1.5" />
                Register Patient
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('name')}>
                    <span className="inline-flex items-center">Name <SortIcon column="name" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('mrn')}>
                    <span className="inline-flex items-center">MRN <SortIcon column="mrn" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('phone')}>
                    <span className="inline-flex items-center">Phone <SortIcon column="phone" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('lastVisit')}>
                    <span className="inline-flex items-center">Last Visit <SortIcon column="lastVisit" /></span>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((patient) => {
                  const lv = lastVisitMap.get(patient.id);
                  return (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {patient.mrn}
                      </TableCell>
                      <TableCell>{patient.phone || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lv ? new Date(lv).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/patients/${patient.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            <Eye className="size-3.5" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <CreatePatientDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />
    </div>
  );
}

function CreatePatientDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: CreatePatientDto) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<CreatePatientDto>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    bloodGroup: '',
    allergies: '',
    chronicConditions: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const update = (field: keyof CreatePatientDto, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setForm({
      firstName: '', lastName: '', dateOfBirth: '', gender: '',
      phone: '', email: '', address: '', bloodGroup: '',
      allergies: '', chronicConditions: '',
      emergencyContactName: '', emergencyContactPhone: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Register New Patient</DialogTitle>
          <DialogDescription>Fill in the patient's information to create a new record.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name *</Label>
              <Input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date of Birth *</Label>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={(v: string | null) => update('gender', v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea value={form.address} onChange={(e) => update('address', e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Blood Group</Label>
            <Select value={form.bloodGroup || ''} onValueChange={(v: string | null) => update('bloodGroup', v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'].map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Emergency Contact</Label>
              <Input value={form.emergencyContactName} onChange={(e) => update('emergencyContactName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Emergency Phone</Label>
              <Input value={form.emergencyContactPhone} onChange={(e) => update('emergencyContactPhone', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Allergies</Label>
            <Textarea value={form.allergies} onChange={(e) => update('allergies', e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Chronic Conditions</Label>
            <Textarea value={form.chronicConditions} onChange={(e) => update('chronicConditions', e.target.value)} rows={2} />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register Patient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
