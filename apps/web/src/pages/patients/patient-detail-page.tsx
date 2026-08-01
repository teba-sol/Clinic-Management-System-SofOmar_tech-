import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import api from '@/lib/api';
import { usePatientContext } from '@/context/patient-context';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, User, Phone, Mail, MapPin, Heart, AlertTriangle,
  FileText, Pill, FlaskConical, Stethoscope, ClipboardList, Receipt,
} from 'lucide-react';
import type { Patient, Visit, Prescription, LabOrder, Invoice } from '@/types';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { patient, visit, setPatient, setVisit } = usePatientContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: fetchedPatient, isLoading } = useQuery<Patient>({
    queryKey: ['patient', id],
    queryFn: () => api.get(`/patients/${id}`).then((r) => r.data),
  });

  useEffect(() => {
    if (fetchedPatient) setPatient(fetchedPatient);
  }, [fetchedPatient, setPatient]);

  const currentPatient = patient || fetchedPatient;

  const { data: visits } = useQuery<Visit[]>({
    queryKey: ['patient-visits', id],
    queryFn: () => api.get(`/visits/patient/${id}`).then((r) => r.data).catch(() => []),
  });

  const { data: prescriptions } = useQuery<Prescription[]>({
    queryKey: ['patient-prescriptions', id],
    queryFn: () => api.get(`/prescriptions/patient/${id}`).then((r) => r.data).catch(() => []),
  });

  const { data: labOrders } = useQuery<LabOrder[]>({
    queryKey: ['patient-lab-orders', id],
    queryFn: () => api.get(`/lab-orders/patient/${id}`).then((r) => r.data).catch(() => []),
  });

  const { data: patientInvoices } = useQuery<Invoice[]>({
    queryKey: ['patient-invoices', id],
    queryFn: () => api.get(`/invoices/patient/${id}`).then((r) => r.data).catch(() => []),
  });

  if (isLoading) return <LoadingPage />;
  if (!currentPatient) return <div className="text-center py-12 text-muted-foreground">Patient not found</div>;

  const age = Math.floor(
    (Date.now() - new Date(currentPatient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );

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
          title={`${currentPatient.firstName} ${currentPatient.lastName}`}
          description={`MRN: ${currentPatient.mrn} | Age: ${age} years`}
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
              <InfoRow icon={User} label="Full Name" value={`${currentPatient.firstName} ${currentPatient.lastName}`} />
              <InfoRow icon={User} label="Gender" value={currentPatient.gender} />
              <InfoRow icon={Heart} label="Date of Birth" value={new Date(currentPatient.dateOfBirth).toLocaleDateString()} />
              <InfoRow icon={Heart} label="Blood Group" value={currentPatient.bloodGroup || 'Unknown'} badge />
              <Separator />
              <InfoRow icon={Phone} label="Phone" value={currentPatient.phone} />
              <InfoRow icon={Mail} label="Email" value={currentPatient.email || '—'} />
              <InfoRow icon={MapPin} label="Address" value={currentPatient.address || '—'} />
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
              <InfoRow label="Name" value={currentPatient.emergencyContactName || '—'} />
              <InfoRow label="Phone" value={currentPatient.emergencyContactPhone || '—'} />
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
              <InfoRow label="Allergies" value={currentPatient.allergies || 'None recorded'} />
              <InfoRow label="Chronic Conditions" value={currentPatient.chronicConditions || 'None recorded'} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="visit">
            <TabsList>
              <TabsTrigger value="visit" className="gap-1.5">
                <Stethoscope className="size-3.5" />
                Visit
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="gap-1.5">
                <Pill className="size-3.5" />
                Prescriptions
              </TabsTrigger>
              <TabsTrigger value="lab-orders" className="gap-1.5">
                <FlaskConical className="size-3.5" />
                Lab Orders
              </TabsTrigger>
              <TabsTrigger value="invoices" className="gap-1.5">
                <Receipt className="size-3.5" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5">
                <ClipboardList className="size-3.5" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visit" className="mt-4 space-y-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4 text-sm text-muted-foreground">
                  {visit ? (
                    <p>Active visit in progress. Add SOAP notes on the <Link to="/visits" className="text-primary underline underline-offset-2">Visits</Link> page.</p>
                  ) : (
                    <p>No active visit. Start one from the <Link to="/queue" className="text-primary underline underline-offset-2">Queue</Link>.</p>
                  )}
                </CardContent>
              </Card>
              {visits && visits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Past Visits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {visits.map((v) => (
                      <div key={v.id} className="p-3 rounded-xl border bg-card">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">
                            {new Date(v.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {v.diagnosisDescription && (
                          <p className="text-sm"><span className="font-medium">Diagnosis:</span> {v.diagnosisDescription}</p>
                        )}
                        {v.assessment && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{v.assessment}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              <Link to="/visits">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="size-3.5" />
                  Manage Visits
                </Button>
              </Link>
            </TabsContent>

            <TabsContent value="prescriptions" className="mt-4 space-y-4">
              {prescriptions && prescriptions.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Prescriptions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {prescriptions.map((rx) => (
                      <div key={rx.id} className="p-3 rounded-xl border bg-card">
                        <p className="text-xs text-muted-foreground mb-1">
                          {new Date(rx.createdAt).toLocaleDateString()}
                        </p>
                        <div className="space-y-1">
                          {(rx.items as any[]).map((item: any, i: number) => (
                            <p key={i} className="text-sm text-muted-foreground">
                              {i + 1}. <span className="font-medium text-foreground">{item.drugName}</span> — {item.dosage}, {item.frequency}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <EmptyState
                  icon={Pill}
                  title="No prescriptions"
                  description="Prescriptions will appear here once created"
                />
              )}
              <Link to="/prescriptions">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="size-3.5" />
                  Manage Prescriptions
                </Button>
              </Link>
            </TabsContent>

            <TabsContent value="lab-orders" className="mt-4 space-y-4">
              {labOrders && labOrders.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Lab Orders</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {labOrders.map((o) => (
                      <div key={o.id} className="p-3 rounded-xl border bg-card">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{o.testType}</p>
                          <StatusBadge status={o.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </p>
                        {o.resultText && (
                          <p className="text-sm mt-1 text-muted-foreground">Result: {o.resultText}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <EmptyState
                  icon={FlaskConical}
                  title="No lab orders"
                  description="Lab orders will appear here once created"
                />
              )}
              <Link to="/lab-orders">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="size-3.5" />
                  Manage Lab Orders
                </Button>
              </Link>
            </TabsContent>

            <TabsContent value="invoices" className="mt-4 space-y-4">
              {['admin', 'cashier'].includes(user?.role || '') && (
                <Button onClick={() => navigate(`/invoices?patientId=${currentPatient.id}`)} className="gap-1.5">
                  <Receipt className="size-4" />
                  Generate Invoice
                </Button>
              )}
              {patientInvoices && patientInvoices.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Invoices ({patientInvoices.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {patientInvoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
                        <div>
                          <p className="text-sm font-medium">${inv.totalAmount}</p>
                          <p className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={inv.status} />
                          {inv.paymentMethod && (
                            <span className="text-xs text-muted-foreground capitalize">{inv.paymentMethod.replace('_', ' ')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <EmptyState icon={Receipt} title="No invoices" description="No invoices for this patient yet" />
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardContent className="space-y-4 pt-4">
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <FileText className="size-3.5 text-primary" />
                      Visits ({visits?.length ?? 0})
                    </h4>
                    {!visits?.length ? (
                      <p className="text-sm text-muted-foreground">No visits recorded</p>
                    ) : (
                      <div className="space-y-2">
                        {visits.slice(0, 5).map((v) => (
                          <div key={v.id} className="text-sm text-muted-foreground">
                            {new Date(v.createdAt).toLocaleDateString()} — {v.diagnosisDescription || 'SOAP notes recorded'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Pill className="size-3.5 text-primary" />
                      Prescriptions ({prescriptions?.length ?? 0})
                    </h4>
                    {!prescriptions?.length ? (
                      <p className="text-sm text-muted-foreground">No prescriptions recorded</p>
                    ) : (
                      <div className="space-y-2">
                        {prescriptions.slice(0, 5).map((rx) => (
                          <div key={rx.id} className="text-sm text-muted-foreground">
                            {new Date(rx.createdAt).toLocaleDateString()} — {(rx.items as any[]).length} medication(s)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <FlaskConical className="size-3.5 text-primary" />
                      Lab Orders ({labOrders?.length ?? 0})
                    </h4>
                    {!labOrders?.length ? (
                      <p className="text-sm text-muted-foreground">No lab orders recorded</p>
                    ) : (
                      <div className="space-y-2">
                        {labOrders.slice(0, 5).map((o) => (
                          <div key={o.id} className="text-sm text-muted-foreground">
                            {new Date(o.createdAt).toLocaleDateString()} — {o.testType} ({o.status.replace('_', ' ')})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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


