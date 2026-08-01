import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { PatientProvider } from '@/context/patient-context';
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
import BookingPage from '@/pages/booking/booking-page';
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/queue-display" element={<QueueDisplayPage />} />
      <Route path="/booking" element={<BookingPage />} />
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
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/doctor" element={<DoctorDashboardPage />} />
        <Route path="/doctor/workspace/:patientId" element={<PatientWorkspacePage />} />
        <Route path="/doctor/workspace/:patientId/:appointmentId" element={<PatientWorkspacePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PatientProvider>
            <AppRoutes />
          </PatientProvider>
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
