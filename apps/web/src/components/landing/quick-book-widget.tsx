import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { departments } from './departments';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TIME_OPTIONS = ['morning', 'afternoon', 'evening'] as const;

interface SubmittedRequest {
  reference: string;
}

export function QuickBookWidget() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<SubmittedRequest | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${API}/booking/doctors`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setDoctors(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setDoctors([]);
      })
      .finally(() => {
        if (active) setLoadingDoctors(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const todayIso = new Date().toISOString().split('T')[0];
  const canSubmit = !!name.trim() && !!phone.trim() && !!department && !!date && !!preferredTime;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/booking/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          department,
          preferredDate: date,
          preferredTime,
          doctorId: doctorId && doctorId !== '__any__' ? doctorId : undefined,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || t('landing.quickBook.error'));
      }
      setSuccess({ reference: data?.reference || data?.id?.slice(0, 8) || '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('landing.quickBook.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setName('');
    setPhone('');
    setEmail('');
    setDepartment('');
    setDate('');
    setPreferredTime('');
    setDoctorId('');
    setReason('');
    setError('');
    setSuccess(null);
  };

  return (
    <section id="book" className="relative z-30 mx-auto w-full max-w-5xl scroll-mt-20 px-5 py-14 lg:px-8 lg:py-16">
      <div className="rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-brand-100 sm:p-8">
        {success ? (
          <div className="py-6 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="size-8" />
            </span>
            <h2 className="mt-5 text-2xl font-bold text-brand-900">{t('landing.quickBook.successTitle')}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t('landing.quickBook.successMessage', { name, phone })}
            </p>
            {success.reference && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-700">
                {t('landing.quickBook.successReference')}: {success.reference}
              </p>
            )}
            <p className="mx-auto mt-4 max-w-md text-xs text-muted-foreground">{t('landing.quickBook.successNote')}</p>
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              className="mt-6 rounded-full border-brand-200 text-brand-700 hover:bg-brand-50"
            >
              {t('landing.quickBook.submitAnother')}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <CalendarCheck className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-brand-900">{t('landing.quickBook.heading')}</h2>
                <p className="text-xs text-muted-foreground">{t('landing.quickBook.subheading')}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="qb-name" className="text-xs font-medium text-muted-foreground">
                  {t('landing.quickBook.name')} <span className="text-cta">*</span>
                </Label>
                <Input id="qb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('landing.quickBook.namePlaceholder')} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qb-phone" className="text-xs font-medium text-muted-foreground">
                  {t('landing.quickBook.phone')} <span className="text-cta">*</span>
                </Label>
                <Input id="qb-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 9XX XXX XXX" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qb-email" className="text-xs font-medium text-muted-foreground">
                  {t('landing.quickBook.email')} <span className="text-muted-foreground/50">({t('landing.quickBook.optional')})</span>
                </Label>
                <Input id="qb-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qb-dept" className="text-xs font-medium text-muted-foreground">
                  {t('landing.quickBook.department')} <span className="text-cta">*</span>
                </Label>
                <Select value={department} onValueChange={(v) => v && setDepartment(v)}>
                  <SelectTrigger id="qb-dept" className="w-full" aria-label={t('landing.quickBook.department')}>
                    <SelectValue>
                      {(value) => (value ? t(value as string) : '')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dep) => (
                      <SelectItem key={dep.nameKey} value={dep.nameKey}>
                        {t(dep.nameKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qb-date" className="text-xs font-medium text-muted-foreground">
                  {t('landing.quickBook.date')} <span className="text-cta">*</span>
                </Label>
                <Input id="qb-date" type="date" value={date} min={todayIso} onChange={(e) => setDate(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t('landing.quickBook.preferredTime')} <span className="text-cta">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={t('landing.quickBook.preferredTime')}>
                  {TIME_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={preferredTime === opt}
                      onClick={() => setPreferredTime(opt)}
                      className={cn(
                        'h-9 rounded-lg border text-xs font-semibold transition-colors',
                        preferredTime === opt
                          ? 'border-brand-700 bg-brand-700 text-white'
                          : 'border-input bg-background text-muted-foreground hover:border-brand-300 hover:text-brand-700',
                      )}
                    >
                      {t(`landing.quickBook.${opt}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="qb-doctor" className="text-xs font-medium text-muted-foreground">
                  {t('landing.quickBook.doctor')} <span className="text-muted-foreground/50">({t('landing.quickBook.optional')})</span>
                </Label>
                <Select value={doctorId} onValueChange={(v) => v && setDoctorId(v)}>
                  <SelectTrigger id="qb-doctor" className="w-full" aria-label={t('landing.quickBook.doctor')}>
                    <SelectValue>
                      {(value) => {
                        if (!value) return '';
                        if (value === '__any__') return t('landing.quickBook.anyDoctor');
                        const doc = doctors.find((d) => d.id === value);
                        return doc ? doc.name : value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">{t('landing.quickBook.anyDoctor')}</SelectItem>
                    {loadingDoctors ? (
                      <SelectItem value="__loading__" disabled>
                        {t('landing.quickBook.loadingDoctors')}
                      </SelectItem>
                    ) : (
                      doctors.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qb-reason" className="text-xs font-medium text-muted-foreground">
                  {t('landing.quickBook.reason')} <span className="text-muted-foreground/50">({t('landing.quickBook.optional')})</span>
                </Label>
                <Textarea
                  id="qb-reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('landing.quickBook.reasonPlaceholder')}
                />
              </div>

              {error && <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">{error}</p>}

              <Button
                type="submit"
                disabled={!canSubmit || submitting}
                className="h-11 w-full rounded-full bg-cta font-semibold text-cta-foreground hover:bg-amber-600 sm:col-span-2 lg:col-span-3"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                {submitting ? t('landing.quickBook.submitting') : t('landing.quickBook.submit')}
              </Button>

              <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-3">
                {t('landing.quickBook.hint')}
              </p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
