import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from './reveal';

export function CtaBanner() {
  const { t } = useTranslation();

  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-8 py-14 text-center lg:px-16 lg:py-16">
            <div className="absolute -right-20 -top-24 size-72 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-white/5" />
            <div className="relative z-10">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white lg:text-4xl">
                {t('landing.cta.title')}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/75">{t('landing.cta.subtitle')}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  render={<a href="#book" />}
                  size="lg"
                  className="h-12 rounded-full bg-cta px-8 font-semibold text-cta-foreground hover:bg-amber-600"
                >
                  {t('landing.cta.button')}
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  render={<a href="#contact" />}
                  size="lg"
                  variant="ghost"
                  className="h-12 rounded-full border border-white/30 px-8 font-semibold text-white hover:bg-white/10"
                >
                  {t('landing.nav.contact')}
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
