import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { AppointmentPriority } from '@/types';

const priorityConfig: Record<
  AppointmentPriority,
  { light: string; dark: string; dot: string }
> = {
  emergency: {
    light: 'bg-red-100 text-red-700 border-red-200',
    dark: 'bg-red-500/20 text-red-300 border-red-500/40',
    dot: 'bg-red-500',
  },
  urgent: {
    light: 'bg-amber-100 text-amber-700 border-amber-200',
    dark: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    dot: 'bg-amber-500',
  },
  routine: {
    light: 'bg-gray-100 text-gray-600 border-gray-200',
    dark: 'bg-white/10 text-slate-300 border-white/15',
    dot: 'bg-slate-400',
  },
};

interface PriorityBadgeProps {
  priority?: AppointmentPriority | null;
  dark?: boolean;
  className?: string;
  withLabel?: boolean;
}

export function PriorityBadge({
  priority = 'routine',
  dark = false,
  className,
  withLabel = true,
}: PriorityBadgeProps) {
  const { t } = useTranslation();
  const cfg = priorityConfig[priority ?? 'routine'] || priorityConfig.routine;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
        dark ? cfg.dark : cfg.light,
        className,
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          cfg.dot,
          priority === 'routine' && 'opacity-50',
        )}
      />
      {withLabel && t(`priority.${priority}`)}
    </span>
  );
}
