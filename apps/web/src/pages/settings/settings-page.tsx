import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  User as UserIcon,
  Building2,
  MonitorCog,
  LogOut,
  ShieldAlert,
  Users,
  Package,
  ImageIcon,
  Sun,
  Moon,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { getApiError } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { cn } from '@/lib/utils';
import type { ClinicSettings as ClinicSettingsType, AuthSession, WorkingDay, ClinicHoliday } from '@/types';

const WEEK_DAYS: WorkingDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_LABELS: Record<WorkingDay, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function ProfileCard() {
  const { user, updateUser } = useAuth();
  const mutation = useMutation({
    mutationFn: (data: { name: string; phone: string }) => api.patch('/users/me', data),
    onSuccess: (_res, vars) => {
      updateUser({ name: vars.name, phone: vars.phone });
      toast.success('Profile updated');
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to update profile')),
  });

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const dirty = name !== user?.name || phone !== (user?.phone ?? '');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Full name</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">Phone</Label>
            <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 ..." />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email ?? ''} disabled />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => mutation.mutate({ name, phone })}
            disabled={!dirty || mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to change password')),
  });

  const submit = () => {
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    mutation.mutate({ currentPassword, newPassword });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Use a strong password you don't use elsewhere</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current password</Label>
          <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={submit}
            disabled={mutation.isPending || !currentPassword || !newPassword}
          >
            {mutation.isPending ? 'Updating...' : 'Change password'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionsCard() {
  const queryClient = useQueryClient();
  const { data: sessions, isLoading } = useQuery<AuthSession[]>({
    queryKey: ['auth-sessions'],
    queryFn: () => api.get('/auth/sessions').then((r) => r.data).catch(() => []),
  });

  const revokeAll = useMutation({
    mutationFn: () => {
      const refreshToken = localStorage.getItem('refreshToken');
      return api.delete('/auth/sessions', { data: { refreshToken } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
      toast.success('Signed out of all other devices');
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to revoke sessions')),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>Devices currently signed in to your account</CardDescription>
        <CardAction>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => revokeAll.mutate()}
            disabled={revokeAll.isPending || !sessions?.length}
            className="gap-2"
          >
            <LogOut className="size-3.5" />
            Log out of all devices
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading sessions...</p>
        ) : !sessions?.length ? (
          <p className="text-sm text-muted-foreground py-4">No active sessions</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3">
                <div>
                  <p className="text-sm font-medium">Active session</p>
                  <p className="text-xs text-muted-foreground">
                    Signed in {new Date(s.createdAt).toLocaleString()} · Expires {new Date(s.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:border-green-500/40 dark:bg-green-500/20 dark:text-green-300">
                  <Check className="size-3" /> Active
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const options: { value: 'light' | 'dark'; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose how the clinic dashboard looks on this device</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors',
                  active
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-background hover:bg-muted/40',
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cn('flex size-9 items-center justify-center rounded-lg', active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                    <Icon className="size-4" />
                  </span>
                  <span className="font-medium">{opt.label}</span>
                </span>
                {active && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Theme is saved on this device. Other staff members can choose their own.
        </p>
      </CardContent>
    </Card>
  );
}

function ClinicInfoForm({
  settings,
}: {
  settings: ClinicSettingsType | undefined;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    clinicName: settings?.clinicName ?? '',
    tagline: settings?.tagline ?? '',
    address: settings?.address ?? '',
    phone: settings?.phone ?? '',
    email: settings?.email ?? '',
    workingDays: (settings?.workingDays ?? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']) as WorkingDay[],
    workingHoursStart: settings?.workingHoursStart ?? '08:00',
    workingHoursEnd: settings?.workingHoursEnd ?? '17:00',
  });
  const [holidays, setHolidays] = useState<ClinicHoliday[]>(settings?.holidays ?? []);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayLabel, setNewHolidayLabel] = useState('');
  const [logoData, setLogoData] = useState<string | null>(settings?.logoData ?? null);
  const [logoMimeType, setLogoMimeType] = useState<string | null>(settings?.logoMimeType ?? null);

  const mutation = useMutation({
    mutationFn: (data: unknown) => api.put('/clinic-settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] });
      toast.success('Clinic settings saved');
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to save clinic settings')),
  });

  const toggleDay = (day: WorkingDay) => {
    setForm((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  const addHoliday = () => {
    if (!newHolidayDate || !newHolidayLabel.trim()) {
      toast.error('Enter a date and label for the holiday');
      return;
    }
    setHolidays((prev) => [...prev, { date: newHolidayDate, label: newHolidayLabel.trim() }]);
    setNewHolidayDate('');
    setNewHolidayLabel('');
  };

  const onLogoChange = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error('Logo must be smaller than 1MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoData(reader.result as string);
      setLogoMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    mutation.mutate({
      ...form,
      holidays,
      logoData,
      logoMimeType,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinic Information</CardTitle>
        <CardDescription>
          Shown on the public website and on printed prescriptions and lab reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
            {logoData ? (
              <img src={logoData} alt="Clinic logo" className="size-full object-contain" />
            ) : (
              <ImageIcon className="size-8 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="logo-upload" className="cursor-pointer rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/40">
                Upload logo
              </Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onLogoChange(e.target.files?.[0])}
              />
              {logoData && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLogoData(null);
                    setLogoMimeType(null);
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">PNG or JPG, up to 1MB</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Clinic name</Label>
            <Input value={form.clinicName} onChange={(e) => setForm((p) => ({ ...p, clinicName: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input value={form.tagline} onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Working days</Label>
            <p className="text-xs text-muted-foreground">Days the clinic is open</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {WEEK_DAYS.map((day) => {
              const active = form.workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted/40',
                  )}
                >
                  {DAY_LABELS[day]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Opens at</Label>
            <Input
              type="time"
              value={form.workingHoursStart}
              onChange={(e) => setForm((p) => ({ ...p, workingHoursStart: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Closes at</Label>
            <Input
              type="time"
              value={form.workingHoursEnd}
              onChange={(e) => setForm((p) => ({ ...p, workingHoursEnd: e.target.value }))}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Holidays</Label>
            <p className="text-xs text-muted-foreground">Days the clinic is closed (informational)</p>
          </div>
          {holidays.length > 0 && (
            <div className="space-y-2">
              {holidays.map((h, i) => (
                <div key={`${h.date}-${i}`} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3">
                  <div>
                    <p className="text-sm font-medium">{h.label}</p>
                    <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString()}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setHolidays((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-2">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={newHolidayDate} onChange={(e) => setNewHolidayDate(e.target.value)} />
            </div>
            <div className="space-y-2 min-w-48">
              <Label className="text-xs">Label</Label>
              <Input value={newHolidayLabel} onChange={(e) => setNewHolidayLabel(e.target.value)} placeholder="e.g. Ethiopian New Year" />
            </div>
            <Button type="button" variant="outline" onClick={addHoliday} className="gap-1.5">
              <Plus className="size-3.5" /> Add
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={mutation.isPending} className="gap-2">
            {mutation.isPending ? 'Saving...' : 'Save clinic settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ClinicAdminCard() {
  const { data: settings, isLoading } = useQuery<ClinicSettingsType>({
    queryKey: ['clinic-settings'],
    queryFn: () => api.get('/clinic-settings').then((r) => r.data),
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Loading clinic settings...</p>
      ) : (
        <ClinicInfoForm settings={settings} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Staff & Services</CardTitle>
          <CardDescription>Manage user accounts and the service catalog</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/users"
            className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Users className="size-4" />
            </span>
            <span>
              <span className="block font-medium">Manage Users</span>
              <span className="block text-xs text-muted-foreground">Add or edit staff accounts and roles</span>
            </span>
          </Link>
          <Link
            to="/services"
            className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Package className="size-4" />
            </span>
            <span>
              <span className="block font-medium">Manage Services</span>
              <span className="block text-xs text-muted-foreground">Update the service catalog and default prices</span>
            </span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState('personal');

  const tabs = useMemo(() => {
    const list = [
      { value: 'personal', label: 'Personal', icon: UserIcon },
      { value: 'appearance', label: 'Appearance', icon: MonitorCog },
    ];
    if (isAdmin) {
      list.push({ value: 'clinic', label: 'Clinic', icon: Building2 });
    }
    return list;
  }, [isAdmin]);

  if (!user) return <LoadingPage />;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account, appearance, and clinic configuration"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5 shrink-0">
                <Icon className="size-3.5" />
                {t.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="personal" className="mt-4 space-y-4">
          <ProfileCard />
          <ChangePasswordCard />
          <SessionsCard />
        </TabsContent>

        <TabsContent value="appearance" className="mt-4 space-y-4">
          <AppearanceCard />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="clinic" className="mt-4 space-y-4">
            <ClinicAdminCard />
          </TabsContent>
        )}
      </Tabs>

      {!isAdmin && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          <ShieldAlert className="size-5 shrink-0" />
          <span>
            Clinic settings (name, logo, working hours, holidays) are managed by the administrator.
          </span>
        </div>
      )}
    </div>
  );
}
