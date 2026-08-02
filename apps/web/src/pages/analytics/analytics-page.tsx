import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BarChart3, DollarSign, Users, Stethoscope, Calendar, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'sonner';

function StatCard({ title, value, subtitle, icon: Icon, className }: { title: string; value: string; subtitle?: string; icon: any; className?: string }) {
  return (
    <Card className={cn('border-primary/10', className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function AnalyticsPage() {
  const today = localDateStr(new Date());
  const thirtyDaysAgo = localDateStr(new Date(Date.now() - 30 * 86400000));
  const ninetyDaysAgo = localDateStr(new Date(Date.now() - 90 * 86400000));

  const [revenueStart, setRevenueStart] = useState(thirtyDaysAgo);
  const [revenueEnd, setRevenueEnd] = useState(today);
  const [flowStart, setFlowStart] = useState(thirtyDaysAgo);
  const [flowEnd, setFlowEnd] = useState(today);
  const [diagStart, setDiagStart] = useState(ninetyDaysAgo);
  const [diagEnd, setDiagEnd] = useState(today);

  const { data: revenue, isFetching: loadingRevenue, refetch: refetchRevenue } = useQuery<any>({
    queryKey: ['analytics-revenue', revenueStart, revenueEnd],
    queryFn: () => api.get(`/analytics/revenue?start=${revenueStart}&end=${revenueEnd}`).then((r) => r.data),
  });

  const { data: flow, isFetching: loadingFlow, refetch: refetchFlow } = useQuery<any>({
    queryKey: ['analytics-flow', flowStart, flowEnd],
    queryFn: () => api.get(`/analytics/patient-flow?start=${flowStart}&end=${flowEnd}`).then((r) => r.data),
  });

  const { data: diagnoses, isFetching: loadingDiag, refetch: refetchDiag } = useQuery<any>({
    queryKey: ['analytics-diagnoses', diagStart, diagEnd],
    queryFn: () => api.get(`/analytics/diagnoses?start=${diagStart}&end=${diagEnd}`).then((r) => r.data),
  });

  const totalRevenue = revenue?.daily?.reduce((s: number, d: any) => s + Number(d.paid || 0), 0) || 0;
  const totalPending = revenue?.daily?.reduce((s: number, d: any) => s + Number(d.pending || 0), 0) || 0;
  const totalVisits = flow?.totals?.total || 0;
  const completedAppts = flow?.totals?.completed || 0;
  const noShowAppts = flow?.totals?.noShow || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description="Revenue, patient flow, and clinical data"
        icon={BarChart3}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign} className="border-emerald-200 bg-emerald-50/50" />
        <StatCard title="Pending" value={`$${totalPending.toFixed(2)}`} icon={TrendingUp} className="border-amber-200 bg-amber-50/50" />
        <StatCard title="Appointments" value={String(totalVisits)} subtitle={`${completedAppts} completed, ${noShowAppts} no-show`} icon={Calendar} />
        <StatCard title="Avg per Day" value={totalVisits > 0 ? `${(totalVisits / Math.max((new Date(flowEnd).getTime() - new Date(flowStart).getTime()) / 86400000, 1)).toFixed(1)}` : '0'} icon={Activity} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="size-4 text-primary" />
            Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 mb-4">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={revenueStart} onChange={(e) => setRevenueStart(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={revenueEnd} onChange={(e) => setRevenueEnd(e.target.value)} className="h-8 text-xs" />
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchRevenue()} className="mt-5" disabled={loadingRevenue}>
              {loadingRevenue ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {revenue?.byMethod && revenue.byMethod.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {revenue.byMethod.map((m: any) => (
                <div key={m.method} className="p-3 rounded-xl border text-center">
                  <p className="text-xs text-muted-foreground capitalize">{m.method?.replace('_', ' ') || 'Unknown'}</p>
                  <p className="text-lg font-bold">${Number(m.total).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{m.count} payments</p>
                </div>
              ))}
            </div>
          )}

          {revenue?.daily && revenue.daily.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium text-right">Invoices</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                    <th className="pb-2 font-medium text-right">Collected</th>
                    <th className="pb-2 font-medium text-right">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {revenue.daily.map((d: any) => (
                    <tr key={d.date} className="border-b last:border-0">
                      <td className="py-2.5">{new Date(d.date).toLocaleDateString()}</td>
                      <td className="py-2.5 text-right">{d.count}</td>
                      <td className="py-2.5 text-right">${Number(d.total).toFixed(2)}</td>
                      <td className="py-2.5 text-right font-medium text-emerald-600">${Number(d.paid).toFixed(2)}</td>
                      <td className="py-2.5 text-right text-amber-600">${Number(d.pending).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No revenue data for this period</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="size-4 text-blue-500" />
              Patient Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-4">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input type="date" value={flowStart} onChange={(e) => setFlowStart(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input type="date" value={flowEnd} onChange={(e) => setFlowEnd(e.target.value)} className="h-8 text-xs" />
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchFlow()} className="mt-5" disabled={loadingFlow}>
                {loadingFlow ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            {flow?.appointments && flow.appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                      <th className="pb-2 font-medium text-right">Showed</th>
                      <th className="pb-2 font-medium text-right">No-Show</th>
                      <th className="pb-2 font-medium text-right">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flow.appointments.map((d: any) => {
                      const showed = Number(d.checkedIn);
                      const rate = d.count > 0 ? ((showed / Number(d.count)) * 100).toFixed(0) : '0';
                      return (
                        <tr key={d.date} className="border-b last:border-0">
                          <td className="py-2">{new Date(d.date).toLocaleDateString()}</td>
                          <td className="py-2 text-right">{d.count}</td>
                          <td className="py-2 text-right text-emerald-600 font-medium">{showed}</td>
                          <td className="py-2 text-right text-red-500">{d.noShow}</td>
                          <td className="py-2 text-right">{rate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No appointment data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="size-4 text-purple-500" />
              Top Diagnoses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-4">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input type="date" value={diagStart} onChange={(e) => setDiagStart(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input type="date" value={diagEnd} onChange={(e) => setDiagEnd(e.target.value)} className="h-8 text-xs" />
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchDiag()} className="mt-5" disabled={loadingDiag}>
                {loadingDiag ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            {diagnoses?.diagnoses && diagnoses.diagnoses.length > 0 ? (
              <div className="space-y-2">
                {diagnoses.diagnoses.map((d: any, i: number) => {
                  const maxCount = Math.max(...diagnoses.diagnoses.map((x: any) => Number(x.count)));
                  const pct = (Number(d.count) / maxCount) * 100;
                  return (
                    <div key={d.code || i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-mono text-xs text-muted-foreground shrink-0">{d.code}</span>
                          <span className="truncate">{d.description || d.code}</span>
                        </div>
                        <span className="font-semibold shrink-0 ml-2">{d.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No diagnosis data recorded</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AnalyticsPage;
