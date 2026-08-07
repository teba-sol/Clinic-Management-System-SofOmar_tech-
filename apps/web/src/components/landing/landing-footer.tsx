import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Send, MessageCircle, Globe, AtSign, MapPin, Phone, Mail } from 'lucide-react';
import { departments } from './departments';
import { useBookingModal } from './booking-modal';
import { useClinicSettings } from '@/hooks/use-clinic-settings';

const quickLinks = [
  { href: '#home', key: 'landing.nav.home' },
  { href: '#why-us', key: 'landing.nav.about' },
  { href: '#services', key: 'landing.nav.services' },
  { href: '#contact', key: 'landing.nav.contact' },
];

const socials = [
  { icon: Send, label: 'Telegram' },
  { icon: MessageCircle, label: 'Chat' },
  { icon: Globe, label: 'Website' },
  { icon: AtSign, label: 'Email' },
];

export function LandingFooter() {
  const { t } = useTranslation();
  const { open } = useBookingModal();
  const { data: settings } = useClinicSettings();

  const clinicName = settings?.clinicName || 'SofOmar Clinic';
  const phone = settings?.phone || t('landing.footer.phone');
  const address = settings?.address || t('landing.footer.address');
  const email = settings?.email || t('landing.footer.email');

  return (
    <footer id="contact" className="scroll-mt-16 bg-brand-950 text-brand-50">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <img src="/landing/logo.svg" alt={clinicName} className="h-11 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{t('landing.footer.tagline')}</p>
            <div className="mt-5 flex gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href="#contact"
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-cta hover:text-cta-foreground"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{t('landing.footer.quickLinks')}</h3>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-white/70 transition-colors hover:text-white">
                    {t(link.key)}
                  </a>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={open}
                  className="text-sm text-white/70 transition-colors hover:text-white"
                >
                  {t('landing.nav.book')}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{t('landing.footer.services')}</h3>
            <ul className="mt-4 grid grid-cols-1 gap-2.5">
              {departments.map((dep) => (
                <li key={dep.nameKey} className="text-sm text-white/70">
                  {t(dep.nameKey)}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{t('landing.footer.contact')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-500" />
                {phone}
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" />
                {address}
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-brand-500" />
                {email}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row lg:px-8">
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} {clinicName}. {t('landing.footer.rights')}
          </p>
          <Link to="/login" className="text-xs font-medium text-white/60 transition-colors hover:text-white">
            {t('landing.footer.staffLogin')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
