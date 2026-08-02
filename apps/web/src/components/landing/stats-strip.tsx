import { useTranslation } from 'react-i18next';
import { Reveal } from './reveal';

const stats = [
  { valueKey: 'landing.stats.doctors', labelKey: 'landing.stats.doctorsLabel' },
  { valueKey: 'landing.stats.patients', labelKey: 'landing.stats.patientsLabel' },
  { valueKey: 'landing.stats.satisfaction', labelKey: 'landing.stats.satisfactionLabel' },
];

export function StatsStrip() {
  const { t } = useTranslation();

  return (
    <section className="relative z-20 bg-gradient-to-b from-brand-100/80 to-white">
      <div className="mx-auto -mt-10 max-w-6xl px-5 pb-16 pt-24 lg:px-8">
        <div className="flex flex-col items-center gap-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-10 lg:gap-16">
          {stats.map((stat, i) => (
            <Reveal key={stat.valueKey} delay={i * 100} className="animate-none">
              <div className="flex size-40 flex-col items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-center shadow-xl ring-8 ring-white/70 lg:size-44">
                <p className="text-3xl font-bold text-white lg:text-4xl">{t(stat.valueKey)}</p>
                <p className="mt-1.5 max-w-[9rem] px-3 text-xs font-medium leading-snug text-white/85">{t(stat.labelKey)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
