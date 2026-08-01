import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; class: string }> = {
  checked_in: { label: 'Checked In', class: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  triaged: { label: 'Triaged', class: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  in_progress: { label: 'With Doctor', class: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

function QueueBoard() {
  const { t, i18n } = useTranslation();
  const dateStr = new Date().toLocaleDateString(i18n.language === 'am' ? 'am-ET' : i18n.language === 'om' ? 'om-ET' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const { data, isFetching } = useQuery<Record<string, { doctorName: string; entries: { id: string; queueNumber: number; status: string; patientName: string; scheduledAt: string }[] }>>({
    queryKey: ['queue-display'],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/queue-display`)
        .then((r) => {
          if (!r.ok) throw new Error('Failed to load');
          return r.json();
        }),
    refetchInterval: 10_000,
  });

  const doctors = data ? Object.entries(data) : [];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('queue.title')}</h1>
          <p className="text-slate-400 text-sm mt-1">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {isFetching && (
            <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {doctors.length === 0 && !isFetching && (
        <div className="flex items-center justify-center h-[60dvh]">
          <div className="text-center">
            <p className="text-5xl text-slate-600 mb-4">--</p>
            <p className="text-xl text-slate-500">{t('queue.noPatients')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {doctors.map(([doctorId, doctor]) => (
          <div
            key={doctorId}
            className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm"
          >
            <div className="px-5 py-4 border-b border-white/10 bg-white/[0.03]">
              <h2 className="text-lg font-semibold truncate">{doctor.doctorName}</h2>
              <p className="text-sm text-slate-400">
                {doctor.entries.length} {doctor.entries.length === 1 ? t('patient.patient') : t('patient.patients')}
              </p>
            </div>

            <div className="divide-y divide-white/5">
              {doctor.entries.map((entry) => {
                const cfg = statusConfig[entry.status] || { label: entry.status, class: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
                const isActive = entry.status === 'in_progress';
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex items-center gap-4 px-5 py-4 transition-colors',
                      isActive && 'bg-amber-500/[0.04]',
                    )}
                  >
                    <div className={cn(
                      'flex items-center justify-center size-14 rounded-xl text-2xl font-bold shrink-0',
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30'
                        : 'bg-white/10 text-white ring-1 ring-white/10',
                    )}>
                      {entry.queueNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-lg font-medium truncate',
                        isActive && 'text-amber-200',
                      )}>
                        {entry.patientName}
                      </p>
                    </div>
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium border shrink-0',
                      cfg.class,
                    )}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-slate-600">
          {t('queue.autoRefreshes')} &middot; {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

export default QueueBoard;
