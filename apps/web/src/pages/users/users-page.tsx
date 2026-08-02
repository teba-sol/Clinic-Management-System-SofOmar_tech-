import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@/types';
import type { CreateUserDto } from '@/types';

export default function UsersPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFilter = searchParams.get('role') || '';

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const filteredUsers = roleFilter ? (users || []).filter((u) => u.role === roleFilter) : users;

  const roleOptions: Record<string, string> = {
    admin: 'Admin',
    doctor: 'Doctor',
    nurse: 'Nurse',
    receptionist: 'Receptionist',
    lab_tech: 'Lab Tech',
    cashier: 'Cashier',
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      toast.success('User created successfully');
    },
    onError: () => toast.error('Failed to create user'),
  });

  if (isLoading) return <LoadingPage />;

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${filteredUsers?.length ?? 0} of ${users?.length ?? 0} users${roleFilter ? ` — ${roleOptions[roleFilter] || roleFilter}` : ''}`}
        action={
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <UserPlus className="size-4" />
            Add User
          </Button>
        }
      />

      {!users?.length ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Add team members to get started"
        />
      ) : (
        <Card>
          <div className="flex items-center justify-between gap-3 px-4 pt-4">
            <p className="text-sm text-muted-foreground">
              {roleFilter ? `${roleOptions[roleFilter] || roleFilter} users` : 'All users'}
            </p>
            <Select
              value={roleFilter || 'all'}
              onValueChange={(v) => setSearchParams(v && v !== 'all' ? { role: v } : {})}
              items={{ all: 'All roles', ...roleOptions }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {Object.entries(roleOptions).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users with this role
                    </TableCell>
                  </TableRow>
                )}
                {filteredUsers?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <StatusBadge status={u.role} />
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <CreateUserForm
            onSubmit={(data) => createMutation.mutate(data)}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateUserForm({
  onSubmit,
  loading,
}: {
  onSubmit: (data: CreateUserDto) => void;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, email, password, role }); }} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Full Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>Email *</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>Password *</Label>
        <Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>Role *</Label>
        <Select
          value={role}
          onValueChange={(v: string | null) => setRole(v ?? "")}
          items={{ admin: 'Admin', doctor: 'Doctor', nurse: 'Nurse', receptionist: 'Receptionist', lab_tech: 'Lab Tech', cashier: 'Cashier' }}
        >
          <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
            <SelectItem value="nurse">Nurse</SelectItem>
            <SelectItem value="receptionist">Receptionist</SelectItem>
            <SelectItem value="lab_tech">Lab Tech</SelectItem>
            <SelectItem value="cashier">Cashier</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading || !name || !email || !password || !role}>
          {loading ? 'Creating...' : 'Create User'}
        </Button>
      </DialogFooter>
    </form>
  );
}
