import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Phone, Mail, MapPin, Heart, AlertTriangle, FileText, Pill } from 'lucide-react';
import type { Patient, Visit, Prescription } from '@/types';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ['patient', id],
    queryFn: () => api.get(`/patients/${id}`).then((r) => r.data),
  });

  const { data: visits } = useQuery<Visit[]>({
    queryKey: ['patient-visits', id],
    queryFn: () => api.get(`/visits/patient/${id}`).then((r) => r.data).catch(() => []),
  });

  const { data: prescriptions } = useQuery<Prescription[]>({
    queryKey: ['patient-prescriptions', id],
    queryFn: () => api.get(`/prescriptions/patient/${id}`).then((r) => r.data).catch(() => []),
  });

  if (isLoading) return <LoadingPage />;
  if (!patient) return <div className="text-center py-12 text-muted-foreground">Patient not found</div>;

  const age = Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  return (
    <div>
      <div className="mb-6">
        <Link to="/patients">
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4">
            <ArrowLeft className="size-4" />
            Back to Patients
          </Button>
        </Link>
        <PageHeader
          title={`${patient.firstName} ${patient.lastName}`}
          description={`MRN: ${patient.mrn} | Age: ${age} years`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4 text-primary" />
                Personal Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={User} label="Full Name" value={`${patient.firstName} ${patient.lastName}`} />
              <InfoRow icon={User} label="Gender" value={patient.gender} />
              <InfoRow icon={Heart} label="Date of Birth" value={new Date(patient.dateOfBirth).toLocaleDateString()} />
              <InfoRow icon={Heart} label="Blood Group" value={patient.bloodGroup || 'Unknown'} badge />
              <Separator />
              <InfoRow icon={Phone} label="Phone" value={patient.phone} />
              <InfoRow icon={Mail} label="Email" value={patient.email || '—'} />
              <InfoRow icon={MapPin} label="Address" value={patient.address || '—'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-amber-500" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Name" value={patient.emergencyContactName || '—'} />
              <InfoRow label="Phone" value={patient.emergencyContactPhone || '—'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="size-4 text-red-500" />
                Medical Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Allergies" value={patient.allergies || 'None recorded'} />
              <InfoRow label="Chronic Conditions" value={patient.chronicConditions || 'None recorded'} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="visits">
            <TabsList>
              <TabsTrigger value="visits" className="gap-1.5">
                <FileText className="size-3.5" />
                Visits ({visits?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="gap-1.5">
                <Pill className="size-3.5" />
                Prescriptions ({prescriptions?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visits" className="mt-4">
              <Card>
                <CardContent>
                  {!visits?.length ? (
                    <p className="text-center py-8 text-muted-foreground">No visits recorded</p>
                  ) : (
                    <div className="space-y-3">
                      {visits.map((visit) => (
                        <div key={visit.id} className="p-4 rounded-xl border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold">Visit</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(visit.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {visit.diagnosisDescription && (
                            <p className="text-sm"><span className="font-medium">Diagnosis:</span> {visit.diagnosisDescription}</p>
                          )}
                          {visit.assessment && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{visit.assessment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prescriptions" className="mt-4">
              <Card>
                <CardContent>
                  {!prescriptions?.length ? (
                    <p className="text-center py-8 text-muted-foreground">No prescriptions recorded</p>
                  ) : (
                    <div className="space-y-3">
                      {prescriptions.map((rx) => (
                        <div key={rx.id} className="p-4 rounded-xl border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold">Prescription</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(rx.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            {(rx.items as any[]).map((item: any, i: number) => (
                              <p key={i} className="text-sm text-muted-foreground">
                                {i + 1}. <span className="font-medium text-foreground">{item.drugName}</span> — {item.dosage}, {item.frequency}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon?: React.ElementType;
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon && <Icon className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {badge ? (
          <StatusBadge status={value} className="mt-0.5" />
        ) : (
          <p className="text-sm font-medium truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
