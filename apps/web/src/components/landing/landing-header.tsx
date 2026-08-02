import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '#home', key: 'landing.nav.home' },
  { href: '#about', key: 'landing.nav.about' },
  { href: '#services', key: 'landing.nav.services' },
  { href: '#contact', key: 'landing.nav.contact' },
];

export function LandingHeader() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-brand-100 bg-white/90 shadow-sm backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-5 lg:h-20 lg:px-8">
        <a href="#home" className="flex items-center gap-2.5 justify-self-start" aria-label={t('app.name')}>
          <span
            className={cn(
              'flex size-10 items-center justify-center rounded-xl',
              scrolled ? 'bg-brand-700 text-white' : 'bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-sm',
            )}
          >
            <Activity className="size-5" />
          </span>
          <span className="leading-tight">
            <span className={cn('block text-sm font-bold tracking-tight lg:text-base', scrolled ? 'text-brand-900' : 'text-white')}>
              {t('app.name')}
            </span>
            <span className={cn('block text-[10px] font-medium uppercase tracking-[0.2em]', scrolled ? 'text-muted-foreground' : 'text-white/70')}>
              {t('app.tagline')}
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 justify-self-center lg:flex" aria-label="Main">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors',
                scrolled ? 'text-brand-900/75 hover:text-brand-700' : 'text-white/85 hover:text-white',
              )}
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5 justify-self-end">
          <div className={cn('hidden lg:block', !scrolled && 'text-white')}>
            <LanguageSwitcher />
          </div>
          <Link
            to="/login"
            className={cn(
              'hidden text-[13px] font-medium transition-colors lg:block',
              scrolled ? 'text-muted-foreground hover:text-brand-700' : 'text-white/60 hover:text-white',
            )}
          >
            {t('landing.nav.staffLogin')}
          </Link>
          <Button
            render={<a href="#book" />}
            className="hidden h-10 rounded-full bg-cta px-6 font-semibold text-cta-foreground hover:bg-amber-600 lg:inline-flex"
          >
            {t('landing.nav.book')}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn('rounded-full lg:hidden', scrolled ? 'text-brand-900 hover:bg-brand-50' : 'text-white hover:bg-white/10')}
            onClick={() => setOpen(true)}
            aria-label={t('landing.nav.menu')}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>{t('landing.nav.menu')}</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4" aria-label="Mobile">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {t(link.key)}
              </a>
            ))}
          </nav>
          <div className="mt-auto space-y-3 px-4 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{t('language.select')}</span>
              <LanguageSwitcher />
            </div>
            <Button
              render={<Link to="/login" />}
              variant="outline"
              className="w-full rounded-full"
              onClick={() => setOpen(false)}
            >
              {t('landing.nav.staffLogin')}
            </Button>
            <Button
              render={<a href="#book" />}
              className="w-full rounded-full bg-cta font-semibold text-cta-foreground hover:bg-amber-600"
              onClick={() => setOpen(false)}
            >
              {t('landing.nav.book')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
