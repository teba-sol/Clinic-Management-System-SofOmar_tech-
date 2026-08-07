import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Users, Building2 } from 'lucide-react';
import { CountUp } from './count-up';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Stats {
  doctors: number;
  patients: number;
  departments: number;
}

const ITEMS = [
  { key: 'doctors' as const, label: 'landing.stats.doctorsLabel', icon: Stethoscope },
  { key: 'patients' as const, label: 'landing.stats.patientsLabel', icon: Users },
  { key: 'departments' as const, label: 'landing.stats.departmentsLabel', icon: Building2 },
];

export function StatsBar() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${API}/booking/stats`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`stats request failed (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const next = {
          doctors: Number(data?.doctors ?? 0),
          patients: Number(data?.patients ?? 0),
          departments: Number(data?.departments ?? 0),
        };
        if (Number.isFinite(next.doctors) && Number.isFinite(next.patients) && Number.isFinite(next.departments)) {
          setStats(next);
        }
      })
      .catch(() => {
        if (active) setStats(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!stats) return null;

  return (
    <section id="stats" className="scroll-mt-20 bg-gradient-to-b from-white to-brand-50 py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-brand-900 lg:text-3xl">{t('landing.stats.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('landing.stats.subtitle')}</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ITEMS.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-100"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="size-6" strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-3xl font-bold tabular-nums text-brand-900">
                  <CountUp value={stats[key] ?? 0} />
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t(label)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
