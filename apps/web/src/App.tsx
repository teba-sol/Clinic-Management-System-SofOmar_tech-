import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { PatientProvider } from '@/context/patient-context';
import { OfflineProvider } from '@/context/offline-context';
import type { UserRole } from '@/types';
import { AppLayout } from '@/components/layout/app-layout';
import HomePage from '@/pages/home-page';
import LoginPage from '@/pages/login-page';
import DashboardPage from '@/pages/dashboard-page';
import PatientsListPage from '@/pages/patients/patients-list-page';
import PatientDetailPage from '@/pages/patients/patient-detail-page';
import AppointmentsPage from '@/pages/appointments/appointments-page';
import QueuePage from '@/pages/appointments/queue-page';
import SchedulesPage from '@/pages/schedules/schedules-page';
import VisitsPage from '@/pages/visits/visits-page';
import PrescriptionsPage from '@/pages/prescriptions/prescriptions-page';
import LabOrdersPage from '@/pages/lab-orders/lab-orders-page';
import InvoicesPage from '@/pages/invoices/invoices-page';
import UsersPage from '@/pages/users/users-page';
import ServicesPage from '@/pages/services/services-page';
import DoctorDashboardPage from '@/pages/doctor/doctor-dashboard-page';
import PatientWorkspacePage from '@/pages/doctor/patient-workspace-page';
import QueueDisplayPage from '@/pages/queue-display/queue-display-page';
import BookingRequestsPage from '@/pages/booking-requests/booking-requests-page';
import AnalyticsPage from '@/pages/analytics/analytics-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const ALL_ROLES: UserRole[] = ['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'cashier'];

const routeRoles: Record<string, UserRole[]> = {
  '/dashboard': ALL_ROLES,
  '/patients': ['admin', 'doctor', 'nurse', 'receptionist'],
  '/appointments': ['admin', 'receptionist'],
  '/booking-requests': ['admin', 'receptionist'],
  '/queue': ['admin', 'nurse', 'receptionist'],
  '/schedules': ['admin'],
  '/visits': ['admin', 'doctor', 'nurse'],
  '/prescriptions': ['admin', 'doctor', 'nurse', 'cashier'],
  '/lab-orders': ['admin', 'doctor', 'lab_tech'],
  '/invoices': ['admin', 'cashier'],
  '/users': ['admin'],
  '/services': ['admin'],
  '/analytics': ['admin', 'cashier'],
  '/doctor': ['doctor'],
};

function RoleRoute({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/queue-display" element={<QueueDisplayPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<RoleRoute roles={routeRoles['/dashboard']}><DashboardPage /></RoleRoute>} />
        <Route path="/patients" element={<RoleRoute roles={routeRoles['/patients']}><PatientsListPage /></RoleRoute>} />
        <Route path="/patients/:id" element={<RoleRoute roles={routeRoles['/patients']}><PatientDetailPage /></RoleRoute>} />
        <Route path="/appointments" element={<RoleRoute roles={routeRoles['/appointments']}><AppointmentsPage /></RoleRoute>} />
        <Route path="/booking-requests" element={<RoleRoute roles={routeRoles['/booking-requests']}><BookingRequestsPage /></RoleRoute>} />
        <Route path="/queue" element={<RoleRoute roles={routeRoles['/queue']}><QueuePage /></RoleRoute>} />
        <Route path="/schedules" element={<RoleRoute roles={routeRoles['/schedules']}><SchedulesPage /></RoleRoute>} />
        <Route path="/visits" element={<RoleRoute roles={routeRoles['/visits']}><VisitsPage /></RoleRoute>} />
        <Route path="/prescriptions" element={<RoleRoute roles={routeRoles['/prescriptions']}><PrescriptionsPage /></RoleRoute>} />
        <Route path="/lab-orders" element={<RoleRoute roles={routeRoles['/lab-orders']}><LabOrdersPage /></RoleRoute>} />
        <Route path="/invoices" element={<RoleRoute roles={routeRoles['/invoices']}><InvoicesPage /></RoleRoute>} />
        <Route path="/users" element={<RoleRoute roles={routeRoles['/users']}><UsersPage /></RoleRoute>} />
        <Route path="/services" element={<RoleRoute roles={routeRoles['/services']}><ServicesPage /></RoleRoute>} />
        <Route path="/analytics" element={<RoleRoute roles={routeRoles['/analytics']}><AnalyticsPage /></RoleRoute>} />
        <Route path="/doctor" element={<RoleRoute roles={routeRoles['/doctor']}><DoctorDashboardPage /></RoleRoute>} />
        <Route path="/doctor/workspace/:patientId" element={<RoleRoute roles={routeRoles['/doctor']}><PatientWorkspacePage /></RoleRoute>} />
        <Route path="/doctor/workspace/:patientId/:appointmentId" element={<RoleRoute roles={routeRoles['/doctor']}><PatientWorkspacePage /></RoleRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OfflineProvider>
          <AuthProvider>
            <PatientProvider>
              <AppRoutes />
            </PatientProvider>
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </OfflineProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
