import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { WorkspaceHeader } from './components/workspace-header';
import { HistoryTab } from './tabs/history-tab';
import { NewVisitTab } from './tabs/new-visit-tab';
import { PrescriptionsTab } from './tabs/prescriptions-tab';
import { LabOrdersTab } from './tabs/lab-orders-tab';
import {
  Stethoscope,
  Pill,
  FlaskConical,
  History,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Patient, Appointment } from '@/types';

export default function PatientWorkspacePage() {
  const { patientId, appointmentId: routeAppointmentId } = useParams<{
    patientId: string;
    appointmentId?: string;
  }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    data: patient,
    isLoading: patientLoading,
    isError: patientError,
    refetch: refetchPatient,
  } = useQuery<Patient>({
    queryKey: ['patient', patientId],
    queryFn: () => api.get(`/patients/${patientId}`).then((r) => r.data),
    enabled: !!patientId,
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ['patient-appointments', patientId],
    queryFn: () =>
      api
        .get(`/appointments/patient/${patientId}`)
        .then((r) => r.data)
        .catch(() => []),
    enabled: !!patientId,
  });

  const activeAppointment = useMemo(() => {
    if (routeAppointmentId) {
      return appointments?.find((a) => a.id === routeAppointmentId) || null;
    }
    return (
      appointments?.find(
        (a) =>
          a.status === 'in_progress' || a.status === 'checked_in',
      ) || null
    );
  }, [appointments, routeAppointmentId]);

  if (patientLoading) return <LoadingPage />;

  if (patientError || !patient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="border-destructive/20 bg-destructive/5 max-w-md">
          <CardContent className="pt-6 pb-6 text-center">
            <AlertCircle className="size-10 text-destructive mx-auto mb-3" />
            <p className="text-sm font-medium text-destructive mb-1">
              Could not load patient
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              The patient may not exist or there was a network error.
            </p>
            <button
              onClick={() => {
                refetchPatient();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mx-auto"
            >
              <RotateCw className="size-3" />
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <WorkspaceHeader
        patient={patient}
        appointment={activeAppointment}
        onBack={() => navigate('/doctor')}
      />

      <div className="mt-6">
        <Tabs defaultValue="visit" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="visit" className="gap-1.5 shrink-0">
              <Stethoscope className="size-3.5" />
              New Visit
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 shrink-0">
              <History className="size-3.5" />
              History
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="gap-1.5 shrink-0">
              <Pill className="size-3.5" />
              Prescriptions
            </TabsTrigger>
            <TabsTrigger value="lab-orders" className="gap-1.5 shrink-0">
              <FlaskConical className="size-3.5" />
              Lab Orders
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="visit" className="mt-0">
              <NewVisitTab
                patientId={patient.id}
                appointmentId={activeAppointment?.id}
                doctorId={user?.id || ''}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <HistoryTab patientId={patient.id} />
            </TabsContent>

            <TabsContent value="prescriptions" className="mt-0">
              <PrescriptionsTab
                patientId={patient.id}
                doctorId={user?.id || ''}
              />
            </TabsContent>

            <TabsContent value="lab-orders" className="mt-0">
              <LabOrdersTab
                patientId={patient.id}
                doctorId={user?.id || ''}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
