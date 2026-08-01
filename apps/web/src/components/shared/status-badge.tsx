import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
  children?: ReactNode;
}

const statusStyles: Record<string, string> = {
  booked: 'bg-gray-100 text-gray-700 border-gray-200',
  checked_in: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  no_show: 'bg-red-100 text-red-700 border-red-200',
  triaged: 'bg-purple-100 text-purple-700 border-purple-200',
  ordered: 'bg-blue-100 text-blue-700 border-blue-200',
  sample_collected: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  partial: 'bg-orange-100 text-orange-700 border-orange-200',
};

const roleStyles: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  doctor: 'bg-blue-100 text-blue-700 border-blue-200',
  nurse: 'bg-pink-100 text-pink-700 border-pink-200',
  receptionist: 'bg-teal-100 text-teal-700 border-teal-200',
  lab_tech: 'bg-amber-100 text-amber-700 border-amber-200',
  cashier: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export function StatusBadge({ status, className, children }: StatusBadgeProps) {
  const style = statusStyles[status] || roleStyles[status] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
        style,
        className,
      )}
    >
      {children || status.replace('_', ' ')}
    </span>
  );
}
