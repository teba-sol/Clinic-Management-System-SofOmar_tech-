import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, Loader2, Heart, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t('auth.welcomeBackToast'));
      navigate('/dashboard');
    } catch {
      toast.error(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-[oklch(0.45_0.18_175)] via-[oklch(0.50_0.16_170)] to-[oklch(0.42_0.14_180)]">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 size-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-white/[0.03]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          {/* Top: Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-12 rounded-2xl bg-white/15 backdrop-blur-sm">
              <Activity className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t('app.name')}</h1>
              <p className="text-white/50 text-[10px] uppercase tracking-[0.2em]">{t('app.tagline')}</p>
            </div>
          </div>

          {/* Center: Headline */}
          <div className="max-w-lg">
            <h2 className="text-[2.75rem] font-bold leading-[1.1] tracking-tight mb-5">
              {t('auth.heroTitle')}<br />
              <span className="text-white/60">{t('auth.heroSubtitle')}</span>
            </h2>
            <p className="text-lg text-white/60 leading-relaxed">
              {t('auth.heroDescription')}
            </p>
          </div>

          {/* Bottom: Feature pills */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2.5">
              <Heart className="size-4 text-pink-300" />
              <span className="text-sm font-medium text-white/80">{t('auth.featurePatientCentered')}</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2.5">
              <Shield className="size-4 text-emerald-300" />
              <span className="text-sm font-medium text-white/80">{t('auth.featureSecure')}</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2.5">
              <Zap className="size-4 text-amber-300" />
              <span className="text-sm font-medium text-white/80">{t('auth.featureRealTimeQueue')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[380px]">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="flex items-center justify-center size-11 rounded-2xl bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t('app.name')}</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t('app.tagline')}</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-1.5">{t('auth.welcomeBack')}</h2>
            <p className="text-sm text-muted-foreground">{t('auth.signInToAccess')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full text-sm font-semibold tracking-wide uppercase"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  {t('auth.signingIn')}
                </>
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </form>

          <p className="mt-10 text-center text-xs text-muted-foreground/60">
            {t('auth.footer')}
          </p>
        </div>
      </div>
    </div>
  );
}
