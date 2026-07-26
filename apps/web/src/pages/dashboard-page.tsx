import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import {
  Users,
  CalendarCheck,
  FlaskConical,
  Receipt,
  Stethoscope,
  ClipboardList,
  TrendingUp,
  Activity,
} from 'lucide-react';
import type { Patient, Appointment, LabOrder, Invoice, DoctorSchedule } from '@/types';

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  description?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={`flex items-center justify-center size-12 rounded-xl ${color}`}>
            <Icon className="size-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: patients, isLoading: loadingPatients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data),
    enabled: ['admin', 'receptionist', 'nurse', 'doctor'].includes(user?.role || ''),
  });

  const { data: appointments, isLoading: loadingAppointments } = useQuery<Appointment[]>({
    queryKey: ['appointments-queue', user?.id],
    queryFn: () => api.get(`/appointments/queue/${user?.id}`).then((r) => r.data),
    enabled: ['doctor', 'nurse', 'admin', 'receptionist'].includes(user?.role || ''),
  });

  const { data: pendingLabOrders } = useQuery<LabOrder[]>({
    queryKey: ['lab-orders-pending'],
    queryFn: () => api.get('/lab-orders/pending').then((r) => r.data),
    enabled: ['admin', 'lab_tech'].includes(user?.role || ''),
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ['invoices-pending'],
    queryFn: () => api.get('/invoices').then((r) => r.data).catch(() => []),
    enabled: ['admin', 'cashier', 'receptionist'].includes(user?.role || ''),
  });

  const { data: schedules } = useQuery<DoctorSchedule[]>({
    queryKey: ['schedules'],
    queryFn: () => api.get('/schedules').then((r) => r.data),
    enabled: ['admin'].includes(user?.role || ''),
  });

  const isLoading = loadingPatients || loadingAppointments;
  if (isLoading) return <LoadingPage />;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0] || 'User'}`}
        description={`Here's what's happening at the clinic today.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {['admin', 'receptionist', 'nurse', 'doctor'].includes(user?.role || '') && (
          <StatCard
            title="Total Patients"
            value={patients?.length ?? 0}
            icon={Users}
            color="bg-gradient-to-br from-teal-500 to-cyan-500"
            description="Registered patients"
          />
        )}
        {['doctor', 'nurse', 'admin', 'receptionist'].includes(user?.role || '') && (
          <StatCard
            title="Today's Queue"
            value={appointments?.length ?? 0}
            icon={ClipboardList}
            color="bg-gradient-to-br from-blue-500 to-indigo-500"
            description="Appointments scheduled"
          />
        )}
        {['admin', 'lab_tech'].includes(user?.role || '') && (
          <StatCard
            title="Pending Lab Orders"
            value={pendingLabOrders?.length ?? 0}
            icon={FlaskConical}
            color="bg-gradient-to-br from-amber-500 to-orange-500"
            description="Awaiting processing"
          />
        )}
        {['admin', 'cashier', 'receptionist'].includes(user?.role || '') && (
          <StatCard
            title="Pending Invoices"
            value={invoices?.filter((i) => i.status === 'pending').length ?? 0}
            icon={Receipt}
            color="bg-gradient-to-br from-emerald-500 to-teal-500"
            description="Awaiting payment"
          />
        )}
        {['admin'].includes(user?.role || '') && (
          <StatCard
            title="Doctor Schedules"
            value={schedules?.length ?? 0}
            icon={Stethoscope}
            color="bg-gradient-to-br from-purple-500 to-pink-500"
            description="Active schedules"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="size-4 text-primary" />
              <h3 className="font-semibold">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['admin', 'receptionist', 'nurse'].includes(user?.role || '') && (
                <a href="/patients" className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 hover:bg-teal-100 transition-colors text-teal-700">
                  <Users className="size-5" />
                  <div>
                    <p className="text-sm font-semibold">Patients</p>
                    <p className="text-xs text-teal-500">Manage records</p>
                  </div>
                </a>
              )}
              {['admin', 'receptionist'].includes(user?.role || '') && (
                <a href="/appointments" className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700">
                  <CalendarCheck className="size-5" />
                  <div>
                    <p className="text-sm font-semibold">Book Appointment</p>
                    <p className="text-xs text-blue-500">Schedule now</p>
                  </div>
                </a>
              )}
              {['admin', 'doctor'].includes(user?.role || '') && (
                <a href="/lab-orders" className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors text-amber-700">
                  <FlaskConical className="size-5" />
                  <div>
                    <p className="text-sm font-semibold">Lab Orders</p>
                    <p className="text-xs text-amber-500">View & manage</p>
                  </div>
                </a>
              )}
              {['admin', 'cashier'].includes(user?.role || '') && (
                <a href="/invoices" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-700">
                  <Receipt className="size-5" />
                  <div>
                    <p className="text-sm font-semibold">Invoices</p>
                    <p className="text-xs text-emerald-500">Process payments</p>
                  </div>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-4 text-primary" />
              <h3 className="font-semibold">Today's Queue</h3>
            </div>
            {(!appointments || appointments.length === 0) ? (
              <div className="text-center py-8">
                <ClipboardList className="size-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No appointments in queue</p>
              </div>
            ) : (
              <div className="space-y-2">
                {appointments.slice(0, 5).map((appt) => (
                  <div key={appt.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center size-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                      #{appt.queueNumber}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Queue #{appt.queueNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      appt.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {appt.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
