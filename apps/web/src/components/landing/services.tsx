import { useTranslation } from 'react-i18next';
import { departments } from './departments';
import { Reveal } from './reveal';

export function Services() {
  const { t } = useTranslation();

  return (
    <section id="services" className="relative scroll-mt-16 overflow-hidden py-20 lg:py-28">
      <img src="/vx.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-900/75 to-brand-800/35" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">{t('landing.services.title')}</h2>
          <p className="mt-3 text-base text-white/75">{t('landing.services.subtitle')}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((dep, i) => (
            <Reveal key={dep.nameKey} delay={(i % 4) * 70}>
              <div className="group h-full rounded-2xl border border-brand-100 bg-white p-6 transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl">
                <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                  <dep.icon className="size-6" />
                </span>
                <h3 className="font-semibold text-brand-900">{t(dep.nameKey)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(dep.descKey)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
