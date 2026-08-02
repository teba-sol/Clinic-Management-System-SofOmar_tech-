import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './reveal';

const cardIndexes = [0, 1, 2];
const featuredImages = [
  '/landing/Labratory.png',
  '/landing/Outpateint-new.png',
  '/landing/child@mother.png',
];

export function FeaturedServices() {
  const { t } = useTranslation();

  return (
    <section className="bg-gradient-to-b from-white to-brand-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-900 lg:text-4xl">{t('landing.featured.title')}</h2>
          <p className="mt-3 text-base text-muted-foreground">{t('landing.featured.subtitle')}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {cardIndexes.map((i) => (
            <Reveal key={i} delay={i * 90}>
              <div className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-100 transition-all hover:-translate-y-1 hover:shadow-2xl">
                <div className="overflow-hidden">
                  <img
                    src={featuredImages[i]}
                    alt={t(`landing.featured.cards.${i}.title`)}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-bold text-brand-900">{t(`landing.featured.cards.${i}.title`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.featured.cards.${i}.desc`)}
                  </p>
                  <a
                    href="#book"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
                  >
                    {t('landing.hero.primaryCta')}
                    <ArrowRight className="size-4" />
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
