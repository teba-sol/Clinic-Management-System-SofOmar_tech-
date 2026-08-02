import { useTranslation } from 'react-i18next';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  const { t } = useTranslation();

  return (
    <section id="home" className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden">
      <img
        src="/xxa.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-900/75 to-brand-800/35" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-24 lg:px-8 lg:py-28">
        <div
          className="inline-flex animate-fade-up items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm"
          style={{ animationDelay: '0.05s' }}
        >
          <Zap className="size-3.5 text-cta" />
          {t('landing.hero.badge')}
        </div>

        <h1
          className="mt-6 max-w-3xl animate-fade-up text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
          style={{ animationDelay: '0.15s' }}
        >
          {t('landing.hero.title')} <span className="text-cta">{t('landing.hero.titleHighlight')}</span>
        </h1>

        <p
          className="mt-6 max-w-2xl animate-fade-up text-base leading-relaxed text-white/75 sm:text-lg"
          style={{ animationDelay: '0.25s' }}
        >
          {t('landing.hero.subtitle')}
        </p>

        <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-3" style={{ animationDelay: '0.35s' }}>
          <Button
            render={<a href="#book" />}
            size="lg"
            className="h-12 rounded-full bg-cta px-8 font-semibold text-cta-foreground hover:bg-amber-600"
          >
            {t('landing.hero.primaryCta')}
            <ArrowRight className="size-4" />
          </Button>
          <Button
            render={<a href="#about" />}
            size="lg"
            variant="ghost"
            className="h-12 rounded-full border border-white/30 px-8 font-semibold text-white hover:bg-white/10"
          >
            {t('landing.hero.secondaryCta')}
          </Button>
        </div>
      </div>
    </section>
  );
}
