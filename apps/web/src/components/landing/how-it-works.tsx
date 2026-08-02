import { useTranslation } from 'react-i18next';
import { Reveal } from './reveal';

const stepIndexes = [0, 1, 2, 3];

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="bg-gradient-to-b from-teal-50 to-teal-100/70 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-900 lg:text-4xl">{t('landing.howItWorks.title')}</h2>
          <p className="mt-3 text-base text-muted-foreground">{t('landing.howItWorks.subtitle')}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {stepIndexes.map((i) => (
            <Reveal key={i} delay={i * 90}>
              <div className="group relative text-center">
                <div className="[perspective:1000px]">
                  <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-700 text-xl font-bold text-white shadow-lg shadow-brand-700/25 transition-transform duration-500 ease-out [transform:translateY(0)_rotateX(0deg)_rotateY(0deg)] [transform-style:preserve-3d] group-hover:shadow-2xl group-hover:[transform:translateY(-1.5rem)_rotateX(-25deg)_rotateY(-45deg)]">
                    {`0${i + 1}`}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-brand-900">{t(`landing.howItWorks.steps.${i}.title`)}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {t(`landing.howItWorks.steps.${i}.desc`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
