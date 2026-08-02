import { useTranslation } from 'react-i18next';
import { Radio, Pill, FlaskConical, CalendarCheck, Wallet, BarChart3 } from 'lucide-react';
import { Reveal } from './reveal';

const featureIndexes = [0, 1, 2, 3, 4, 5];

const icons = [Radio, Pill, FlaskConical, CalendarCheck, Wallet, BarChart3];

export function WhyChooseUs() {
  const { t } = useTranslation();

  return (
    <section id="why-us" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-900 lg:text-4xl">{t('landing.whyChooseUs.title')}</h2>
          <p className="mt-3 text-base text-muted-foreground">{t('landing.whyChooseUs.subtitle')}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featureIndexes.map((i) => {
            const Icon = icons[i];
            return (
              <Reveal key={i} delay={(i % 3) * 90}>
                <div className="group h-full rounded-2xl border border-brand-100 bg-white p-6 transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl">
                  <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="font-semibold text-brand-900">{t(`landing.whyChooseUs.features.${i}.title`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.whyChooseUs.features.${i}.desc`)}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
