import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Appointment, AppointmentPriority } from '@/types';

interface PriorityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onSave: (priority: AppointmentPriority, reason: string) => void;
  isSaving?: boolean;
  patientName?: string;
}

const priorityOptions: { value: AppointmentPriority; selected: string }[] = [
  {
    value: 'routine',
    selected: 'border-gray-400 bg-gray-50 text-gray-800 ring-1 ring-gray-400',
  },
  {
    value: 'urgent',
    selected: 'border-amber-500 bg-amber-50 text-amber-800 ring-1 ring-amber-500',
  },
  {
    value: 'emergency',
    selected: 'border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500',
  },
];

export function PriorityDialog({
  open,
  onOpenChange,
  appointment,
  onSave,
  isSaving,
  patientName,
}: PriorityDialogProps) {
  const { t } = useTranslation();
  const [priority, setPriority] = useState<AppointmentPriority>('urgent');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && appointment) {
      setPriority(appointment.priority === 'routine' || !appointment.priority ? 'urgent' : appointment.priority);
      setReason(appointment.priorityReason ?? '');
      setError('');
    }
  }, [open, appointment]);

  const handleSave = () => {
    if (priority !== 'routine' && !reason.trim()) {
      setError(t('priority.reasonRequired'));
      return;
    }
    onSave(priority, reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('priority.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('priority.dialogDescription')}
            {patientName && ` ${patientName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {priorityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPriority(opt.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-sm font-semibold transition-colors',
                priority === opt.value
                  ? opt.selected
                  : 'border-gray-200 bg-white text-muted-foreground hover:border-gray-300',
              )}
            >
              {t(`priority.${opt.value}`)}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority-reason">{t('priority.reason')}</Label>
          <Textarea
            id="priority-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder={t('priority.reasonPlaceholder')}
            rows={3}
            disabled={priority === 'routine'}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? t('common.loading') : t('priority.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
