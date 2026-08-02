import { useTranslation } from 'react-i18next';
import { HeartHandshake } from 'lucide-react';
import { Reveal } from './reveal';

const itemIndexes = [0, 1, 2, 3, 4, 5];

export function WhatWeProvide() {
  const { t } = useTranslation();

  return (
    <section id="about" className="scroll-mt-16 bg-white py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <Reveal>
          <div className="relative min-h-[320px] overflow-hidden rounded-3xl lg:min-h-[520px]">
            <img
              src="/landing/team.png"
              alt="SofOmar Clinic medical team"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-900/40 to-transparent" />
            <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm">
              <HeartHandshake className="size-3.5 text-cta" />
              {t('landing.whatWeProvide.badge')}
            </span>
            <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-white/10 p-5 backdrop-blur-md ring-1 ring-white/20">
              <p className="text-sm font-semibold text-white">{t('app.name')}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/75">{t('landing.footer.tagline')}</p>
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-brand-900 lg:text-4xl">{t('landing.whatWeProvide.title')}</h2>
            <p className="mt-3 max-w-lg text-base text-muted-foreground">{t('landing.whatWeProvide.subtitle')}</p>
          </Reveal>

          <ul className="mt-8 space-y-3">
            {itemIndexes.map((i) => (
              <Reveal key={i} delay={i * 60}>
                <li className="group relative overflow-hidden rounded-xl border border-transparent bg-brand-50/60 p-4 pl-6 transition-all hover:border-brand-100 hover:bg-white hover:shadow-md">
                  <span className="absolute inset-y-0 left-0 w-1 bg-cta opacity-0 transition-opacity duration-300 group-hover:opacity-100 [.reveal.is-visible_&]:opacity-100" />
                  <h3 className="font-semibold text-brand-900">{t(`landing.whatWeProvide.items.${i}.title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.whatWeProvide.items.${i}.desc`)}
                  </p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
