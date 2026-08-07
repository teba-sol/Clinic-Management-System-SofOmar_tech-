import { useTranslation } from 'react-i18next';
import { departments } from './departments';
import { Reveal } from './reveal';

export function Services() {
  const { t } = useTranslation();

  return (
    <section id="services" className="relative scroll-mt-16 overflow-hidden bg-gradient-to-b from-white via-brand-50/60 to-white py-20 lg:py-28">
      <div className="pointer-events-none absolute -left-28 top-16 size-80 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 size-96 rounded-full bg-cta/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-100">
            {t('landing.services.badge')}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">
            {t('landing.services.title')}
          </h2>
          <p className="mt-3 text-base text-gray-500">{t('landing.services.subtitle')}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((dep, i) => (
            <Reveal key={dep.nameKey} delay={(i % 4) * 70}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5">
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-cta opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative mb-5 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-md shadow-brand-900/10 transition-transform duration-300 group-hover:scale-110">
                  <dep.icon className="size-6" />
                </span>
                <h3 className="text-base font-semibold text-gray-900">{t(dep.nameKey)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{t(dep.descKey)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
