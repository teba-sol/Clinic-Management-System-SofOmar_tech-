'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CalendarCheck, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn, toLocalDateInput } from '@/lib/utils';
import { departments } from './departments';
import { SlotPicker } from '@/components/appointments/slot-picker';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TIME_OPTIONS = ['morning', 'afternoon', 'evening'] as const;

function timeBucket(hhmm: string): 'morning' | 'afternoon' | 'evening' {
  const h = Number(hhmm.split(':')[0]) || 0;
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

interface SubmittedRequest {
  reference: string;
}

const fieldClass =
  'h-11 rounded-lg border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:border-cta focus-visible:ring-cta/30 [color-scheme:dark]';

const selectFieldClass =
  'w-full rounded-lg border-white/20 bg-white/10 text-white data-[size=default]:h-11 focus-visible:border-cta focus-visible:ring-cta/30 data-placeholder:text-white/40';

const areaClass =
  'rounded-lg border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:border-cta focus-visible:ring-cta/30';

interface BookingModalContextValue {
  open: () => void;
  close: () => void;
}

const BookingModalContext = createContext<BookingModalContextValue | null>(null);

export function useBookingModal() {
  const ctx = useContext(BookingModalContext);
  if (!ctx) throw new Error('useBookingModal must be used within BookingModalProvider');
  return ctx;
}

export function BookingModalProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [bookSlot, setBookSlot] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<SubmittedRequest | null>(null);

  useEffect(() => {
    if (!open || doctors.length > 0) return;
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
  }, [open, doctors.length]);

  const showSlotPicker = !!doctorId && doctorId !== '__any__' && !!date;

  useEffect(() => {
    setBookSlot('');
    setPreferredTime('');
  }, [doctorId, date]);

  const todayIso = toLocalDateInput(new Date());
  const canSubmit = !!name.trim() && !!phone.trim() && !!department && !!date && !!preferredTime;

  const reset = useCallback(() => {
    setName('');
    setPhone('');
    setEmail('');
    setDepartment('');
    setDate('');
    setPreferredTime('');
    setBookSlot('');
    setDoctorId('');
    setReason('');
    setError('');
    setSuccess(null);
  }, []);

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

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  return (
    <BookingModalContext.Provider
      value={{ open: () => setOpen(true), close: () => handleOpenChange(false) }}
    >
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[92svh] max-w-lg overflow-y-auto rounded-3xl border-0 bg-gradient-to-b from-brand-700 via-brand-800 to-brand-950 p-0 text-white ring-white/15 sm:max-w-xl"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-cta/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-white/10 blur-3xl" />

          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            aria-label={t('common.close')}
            className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>

          <DialogHeader className="p-6 pb-1 text-center">
            <span className="mx-auto inline-flex animate-fade-up items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm">
              <CalendarCheck className="size-3.5 text-cta" />
              {t('landing.quickBook.badge')}
            </span>
            <DialogTitle className="text-2xl font-bold tracking-tight text-white">
              {t('landing.quickBook.heading')}
            </DialogTitle>
            <DialogDescription className="text-white/75">{t('landing.quickBook.subheading')}</DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-3">
            {success ? (
              <div className="py-8 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-400/20 text-green-300">
                  <CheckCircle2 className="size-6" />
                </span>
                <h3 className="mt-4 text-xl font-bold text-white">{t('landing.quickBook.successTitle')}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/75">
                  {t('landing.quickBook.successMessage', { name, phone })}
                </p>
                {success.reference && (
                  <p className="mt-3 text-sm text-white/70">
                    {t('landing.quickBook.successReference')}:{' '}
                    <span className="font-semibold text-cta">{success.reference}</span>
                  </p>
                )}
                <p className="mx-auto mt-4 max-w-md text-xs text-white/50">{t('landing.quickBook.successNote')}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={reset}
                  className="mt-6 rounded-full border-white/30 bg-transparent text-white hover:bg-white/10"
                >
                  {t('landing.quickBook.submitAnother')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="qb-name" className="text-sm font-medium text-white/85">
                    {t('landing.quickBook.name')} <span className="text-cta">*</span>
                  </Label>
                  <Input
                    id="qb-name"
                    className={fieldClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('landing.quickBook.namePlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qb-phone" className="text-sm font-medium text-white/85">
                    {t('landing.quickBook.phone')} <span className="text-cta">*</span>
                  </Label>
                  <Input
                    id="qb-phone"
                    type="tel"
                    className={fieldClass}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 9XX XXX XXX"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qb-email" className="text-sm font-medium text-white/85">
                    {t('landing.quickBook.email')}{' '}
                    <span className="text-white/45">({t('landing.quickBook.optional')})</span>
                  </Label>
                  <Input
                    id="qb-email"
                    type="email"
                    className={fieldClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qb-dept" className="text-sm font-medium text-white/85">
                    {t('landing.quickBook.department')} <span className="text-cta">*</span>
                  </Label>
                  <Select value={department} onValueChange={(v) => v && setDepartment(v)}>
                    <SelectTrigger id="qb-dept" className={selectFieldClass} aria-label={t('landing.quickBook.department')}>
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
                  <Label htmlFor="qb-date" className="text-sm font-medium text-white/85">
                    {t('landing.quickBook.date')} <span className="text-cta">*</span>
                  </Label>
                  <Input
                    id="qb-date"
                    type="date"
                    className={fieldClass}
                    value={date}
                    min={todayIso}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-sm font-medium text-white/85">
                    {t('landing.quickBook.preferredTime')} <span className="text-cta">*</span>
                  </Label>
                  {showSlotPicker ? (
                    <SlotPicker
                      doctorId={doctorId}
                      date={date}
                      value={bookSlot}
                      onChange={(slot) => {
                        setBookSlot(slot);
                        setPreferredTime(timeBucket(slot));
                      }}
                      public
                      tone="dark"
                    />
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={t('landing.quickBook.preferredTime')}>
                      {TIME_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          role="radio"
                          aria-checked={preferredTime === opt}
                          onClick={() => setPreferredTime(opt)}
                          className={cn(
                            'h-10 rounded-lg border text-sm font-medium transition-colors',
                            preferredTime === opt
                              ? 'border-cta bg-cta text-cta-foreground'
                              : 'border-white/25 bg-white/10 text-white/85 hover:bg-white/15 hover:text-white',
                          )}
                        >
                          {t(`landing.quickBook.${opt}`)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qb-doctor" className="text-sm font-medium text-white/85">
                    {t('landing.quickBook.doctor')}{' '}
                    <span className="text-white/45">({t('landing.quickBook.optional')})</span>
                  </Label>
                  <Select value={doctorId} onValueChange={(v) => v && setDoctorId(v)}>
                    <SelectTrigger id="qb-doctor" className={selectFieldClass} aria-label={t('landing.quickBook.doctor')}>
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

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="qb-reason" className="text-sm font-medium text-white/85">
                    {t('landing.quickBook.reason')}{' '}
                    <span className="text-white/45">({t('landing.quickBook.optional')})</span>
                  </Label>
                  <Textarea
                    id="qb-reason"
                    rows={3}
                    className={areaClass}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t('landing.quickBook.reasonPlaceholder')}
                  />
                </div>

                {error && <p className="text-sm text-red-300 sm:col-span-2">{error}</p>}

                <Button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="h-11 w-full rounded-full bg-cta font-semibold text-cta-foreground hover:bg-amber-600 sm:col-span-2"
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  {submitting ? t('landing.quickBook.submitting') : t('landing.quickBook.submit')}
                </Button>

                <div className="flex items-start gap-3 rounded-xl bg-amber-400/15 p-3.5 ring-1 ring-amber-300/30 sm:col-span-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-amber-300" />
                  <p className="text-sm leading-relaxed text-amber-100">{t('landing.quickBook.hint')}</p>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </BookingModalContext.Provider>
  );
}
