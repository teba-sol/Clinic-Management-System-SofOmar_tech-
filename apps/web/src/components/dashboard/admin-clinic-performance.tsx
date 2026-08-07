import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { BarChart3, Activity, DollarSign, Clock, Wallet, TrendingDown, Receipt } from 'lucide-react';

type Range = '7d' | '30d';

interface PatientVolumeDatum {
  date: string;
  count: string | number;
}

interface RevenueDatum {
  category: string;
  total: string | number;
}

interface PeakHourDatum {
  hour: string | number;
  count: string | number;
}

interface BillingSummary {
  collected: number;
  outstanding: number;
  unpaidInvoices: number;
  byMethod: { method: string; total: number; count: number }[];
}

const TEAL = '#14b8a6';
const AMBER = '#f59e0b';

function formatHour(h: number): string {
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${h < 12 ? 'AM' : 'PM'}`;
}

const tooltipStyle = {
  borderRadius: 8,
  fontSize: 12,
  border: '1px solid hsl(var(--border))',
};

function ChartSkeleton() {
  return (
    <div className="flex h-[260px] items-end gap-1.5 px-1 pt-4 pb-1" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${28 + ((i * 37) % 55)}%` }} />
      ))}
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="flex h-[260px] items-center justify-center">
      <p className="text-sm text-muted-foreground">Not enough data yet for this range</p>
    </div>
  );
}

export function AdminClinicPerformance() {
  const [range, setRange] = useState<Range>('30d');

  const { data: volume, isPending: volumeLoading } = useQuery<PatientVolumeDatum[]>({
    queryKey: ['analytics-patient-volume', range],
    queryFn: () => api.get(`/analytics/patient-volume?range=${range}`).then((r) => r.data),
  });

  const { data: revenue, isPending: revenueLoading } = useQuery<RevenueDatum[]>({
    queryKey: ['analytics-revenue-by-service', range],
    queryFn: () => api.get(`/analytics/revenue-by-service?range=${range}`).then((r) => r.data),
  });

  const { data: peak, isPending: peakLoading } = useQuery<PeakHourDatum[]>({
    queryKey: ['analytics-peak-hours', range],
    queryFn: () => api.get(`/analytics/peak-hours?range=${range}`).then((r) => r.data),
  });

  const { data: billing, isPending: billingLoading } = useQuery<BillingSummary>({
    queryKey: ['analytics-billing-summary', range],
    queryFn: () => api.get(`/analytics/billing-summary?range=${range}`).then((r) => r.data).catch(() => ({
      collected: 0, outstanding: 0, unpaidInvoices: 0, byMethod: [],
    })),
  });

  const volumeData = (volume || []).map((d) => ({ date: d.date, count: Number(d.count) }));
  const revenueData = (revenue || []).map((d) => ({ category: d.category, total: Number(d.total) }));
  const peakData = (peak || [])
    .map((d) => ({ hour: Number(d.hour), count: Number(d.count) }))
    .sort((a, b) => a.hour - b.hour);

  return (
    <section aria-label="Clinic Performance" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" /> Clinic Performance
        </h2>
        <div className="inline-flex self-start sm:self-auto rounded-lg bg-muted p-0.5">
          {(['7d', '30d'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                range === r
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {r === '7d' ? 'Last 7 days' : 'Last 30 days'}
            </button>
          ))}
        </div>
      </div>

      <FinancialSnapshot summary={billing} loading={billingLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="size-4 text-teal-500" /> Patient Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {volumeLoading ? (
              <ChartSkeleton />
            ) : volumeData.length === 0 ? (
              <ChartEmpty />
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={volumeData} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickMargin={6}
                      minTickGap={20}
                      tickFormatter={(d: string) => d.slice(5).replace('-', '/')}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={34} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [`${value}`, 'Patients']}
                      labelFormatter={(label) => new Date(String(label)).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={TEAL}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="size-4 text-teal-500" /> Revenue by Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <ChartSkeleton />
            ) : revenueData.length === 0 ? (
              <ChartEmpty />
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} tickMargin={6} />
                    <YAxis tick={{ fontSize: 11 }} width={54} tickFormatter={(v: number) => `$${v}`} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {revenueData.map((_, i) => (
                        <Cell key={i} fill={i % 2 === 0 ? TEAL : AMBER} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="size-4 text-teal-500" /> Peak Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {peakLoading ? (
              <ChartSkeleton />
            ) : peakData.length === 0 ? (
              <ChartEmpty />
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakData} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 11 }}
                      tickMargin={6}
                      minTickGap={12}
                      tickFormatter={(h: number) => formatHour(h)}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={34} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [`${value}`, 'Appointments']}
                      labelFormatter={(label) => formatHour(Number(label))}
                    />
                    <Bar dataKey="count" fill={TEAL} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

const PAYMENT_METHODS: { method: string; label: string; chip: string }[] = [
  { method: 'cash', label: 'Cash', chip: 'bg-emerald-100 text-emerald-700' },
  { method: 'telebirr', label: 'Telebirr', chip: 'bg-blue-100 text-blue-700' },
  { method: 'cbe_birr', label: 'CBE Birr', chip: 'bg-violet-100 text-violet-700' },
  { method: 'insurance', label: 'Insurance', chip: 'bg-amber-100 text-amber-700' },
];

function fmtMoney(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function FinancialSnapshot({ summary, loading }: { summary?: BillingSummary; loading: boolean }) {
  const s = summary || { collected: 0, outstanding: 0, unpaidInvoices: 0, byMethod: [] };
  const collected = s.collected || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wallet className="size-4 text-teal-500" /> Financial Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-emerald-600" /> Collected
                </p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{fmtMoney(collected)}</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <TrendingDown className="size-3.5 text-amber-600" /> Outstanding
                </p>
                <p className="text-2xl font-bold text-amber-700 mt-1">{fmtMoney(s.outstanding || 0)}</p>
              </div>
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Receipt className="size-3.5 text-rose-600" /> Unpaid invoices
                </p>
                <p className="text-2xl font-bold text-rose-700 mt-1">{s.unpaidInvoices || 0}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(s.byMethod || []).length === 0 && (
                <span className="text-xs text-muted-foreground">No payments recorded in this period.</span>
              )}
              {(s.byMethod || []).map((b) => {
                const meta = PAYMENT_METHODS.find((m) => m.method === b.method);
                const pct = collected > 0 ? Math.round((b.total / collected) * 100) : 0;
                return (
                  <div key={b.method} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', meta?.chip || 'bg-muted text-muted-foreground')}>
                      {meta?.label || b.method}
                    </span>
                    <span className="font-semibold">{fmtMoney(b.total)}</span>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
