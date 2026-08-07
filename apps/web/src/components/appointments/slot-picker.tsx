import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface AvailableSlot {
  time: string;
  label: string;
  booked: boolean;
  past: boolean;
}

interface SlotPickerProps {
  doctorId: string;
  date: string;
  value: string;
  onChange: (time: string) => void;
  public?: boolean;
  tone?: 'light' | 'dark';
}

export function SlotPicker({ doctorId, date, value, onChange, public: isPublic = false, tone = 'light' }: SlotPickerProps) {
  const { t } = useTranslation();

  const { data: slots, isLoading, isError } = useQuery<AvailableSlot[]>({
    queryKey: ['available-slots', doctorId, date, isPublic],
    queryFn: async () => {
      if (isPublic) {
        const res = await fetch(
          `${API}/appointments/available-slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`,
        );
        if (!res.ok) throw new Error('Failed to load slots');
        return res.json();
      }
      const res = await api.get('/appointments/available-slots', {
        params: { doctorId, date },
      });
      return res.data;
    },
    enabled: !!doctorId && !!date,
    staleTime: 30_000,
  });

  const availableCount = (slots || []).filter((s) => !s.booked && !s.past).length;

  const labelClass = tone === 'dark' ? 'text-white/75' : 'text-muted-foreground';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-xs font-medium', labelClass)}>{t('slotPicker.select')}</span>
        {!isLoading && slots && (
          <span className={cn('text-xs', labelClass)}>
            {availableCount} {t('slotPicker.available')}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 rounded-lg" />
          ))}
        </div>
      )}

      {isError && <p className="text-sm text-destructive">{t('slotPicker.error')}</p>}

      {!isLoading && !isError && slots && slots.length === 0 && (
        <p className={cn('text-sm', labelClass)}>{t('slotPicker.noSlots')}</p>
      )}

      {!isLoading && !isError && slots && slots.length > 0 && (
        <div
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
          role="radiogroup"
          aria-label={t('slotPicker.select')}
        >
          {slots.map((slot) => {
            const disabled = slot.booked || slot.past;
            const selected = value === slot.time;
            return (
              <button
                key={slot.time}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => onChange(slot.time)}
                className={cn(
                  'h-9 rounded-lg border text-sm font-medium transition-colors',
                  disabled
                    ? tone === 'dark'
                      ? 'cursor-not-allowed border-white/15 bg-white/5 text-white/40 line-through opacity-70'
                      : 'cursor-not-allowed border-input bg-muted text-muted-foreground line-through opacity-60'
                    : selected
                      ? tone === 'dark'
                        ? 'border-cta bg-cta text-cta-foreground'
                        : 'border-primary bg-primary text-primary-foreground'
                      : tone === 'dark'
                        ? 'border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white'
                        : 'border-input bg-background text-foreground hover:border-primary/60 hover:bg-accent',
                )}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
