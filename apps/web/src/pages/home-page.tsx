import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Users,
  CalendarCheck,
  ClipboardList,
  Pill,
  FlaskConical,
  ArrowRight,
  Shield,
  Zap,
  Heart,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

const features = [
  {
    icon: Users,
    title: 'Patient Records',
    description: 'Manage patient demographics, medical history, and contact information in one place.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    icon: CalendarCheck,
    title: 'Smart Scheduling',
    description: 'Book appointments with doctor availability, slot duration, and real-time queue tracking.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: ClipboardList,
    title: 'Live Queue',
    description: 'Patients see their queue number update in real-time via WebSocket — no more waiting in the dark.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Pill,
    title: 'E-Prescriptions',
    description: 'Generate digital prescriptions with PDF export, attached directly to patient visits.',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
  },
  {
    icon: FlaskConical,
    title: 'Lab Orders',
    description: 'Order tests, track sample collection, and record results — all integrated into the visit flow.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Six distinct roles ensure every staff member sees exactly what they need — nothing more.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
];

const stats = [
  { value: '6', label: 'User Roles' },
  { value: 'Real-time', label: 'Queue Updates' },
  { value: 'E-Prescription', label: 'PDF Generation' },
  { value: '24/7', label: 'System Access' },
];

export default function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-9 rounded-xl bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">SofOmar Clinic</span>
              <span className="hidden sm:inline text-[10px] text-muted-foreground uppercase tracking-[0.2em] ml-2">Management System</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button render={<Link to="/dashboard" />} className="rounded-full px-5">
                  Dashboard
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={logout} title="Log out">
                  <LogOut className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <Button render={<Link to="/booking" />} variant="ghost" className="rounded-full px-5">
                  {t('auth.bookAppointment')}
                </Button>
                <Button render={<Link to="/login" />} variant="ghost" className="rounded-full px-5">
                  {t('auth.login')}
                </Button>
              </>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.96_0.01_175)] via-background to-[oklch(0.95_0.015_190)]" />
        <div className="absolute -top-40 -right-40 size-96 rounded-full bg-primary/5" />
        <div className="absolute -bottom-32 -left-32 size-80 rounded-full bg-primary/5" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 sm:pt-20 sm:pb-24">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: Text */}
            <div className="flex-1 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold rounded-full px-3 py-1.5 mb-6">
                <Zap className="size-3.5" />
                {t('app.name')}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
                {t('home.heroTitle')}<br />
                <span className="text-primary">{t('home.heroSubtitle')}</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {t('home.description')}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button render={<Link to="/booking" />} size="lg" className="rounded-full px-7 h-12 text-sm font-semibold">
                  {t('auth.bookAppointment')}
                  <ArrowRight className="size-4 ml-1" />
                </Button>
                <Button render={<Link to="/login" />} size="lg" variant="outline" className="rounded-full px-7 h-12 text-sm font-semibold">
                  {t('auth.staffLogin')}
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Right: Banner Image */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border bg-white">
                <img
                  src="/rightbanner.jpg"
                  alt="Clinic Management"
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/70 backdrop-blur-sm border rounded-2xl p-5 text-center">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Everything Your Clinic Needs
            </h2>
            <p className="text-muted-foreground text-base max-w-lg mx-auto">
              A complete management system designed for the way clinics actually work.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div key={feature.title} className="group border rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className={`inline-flex items-center justify-center size-11 rounded-xl ${feature.bg} mb-4`}>
                  <feature.icon className={`size-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-base mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-24 bg-gradient-to-b from-background to-[oklch(0.96_0.01_175)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              How It Works
            </h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              Three simple steps to digital clinic management.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Register Staff',
                desc: 'Admin creates accounts for doctors, nurses, receptionists, and other staff with appropriate roles.',
              },
              {
                step: '02',
                title: 'Book & Manage',
                desc: 'Receptionists book appointments, doctors record visits, and the queue updates in real-time.',
              },
              {
                step: '03',
                title: 'Deliver Care',
                desc: 'Write prescriptions, order lab tests, generate invoices — all connected in one workflow.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary text-primary-foreground text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[oklch(0.55_0.17_175)] via-[oklch(0.50_0.15_175)] to-[oklch(0.48_0.13_180)] p-10 sm:p-14 text-center text-white">
            <div className="absolute -top-20 -right-20 size-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-white/5" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Ready to Modernize Your Clinic?
              </h2>
              <p className="text-white/70 text-base max-w-md mx-auto mb-8">
                Join healthcare teams already using SofOmar Clinic to deliver better patient care.
              </p>
              <Button render={<Link to="/login" />} size="lg" className="rounded-full px-8 h-12 text-sm font-semibold bg-white text-primary hover:bg-white/90">
                Sign In to Get Started
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <span className="text-sm font-semibold">SofOmar Clinic</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/booking" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Book Appointment
            </Link>
            <Link to="/queue-display" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Queue Display
            </Link>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} SofOmar Tech.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
