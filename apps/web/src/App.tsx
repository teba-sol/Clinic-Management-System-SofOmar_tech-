import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { AppLayout } from '@/components/layout/app-layout';
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

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/patients" element={<PatientsListPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/visits" element={<VisitsPage />} />
        <Route path="/prescriptions" element={<PrescriptionsPage />} />
        <Route path="/lab-orders" element={<LabOrdersPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
