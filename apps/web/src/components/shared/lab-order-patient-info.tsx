import { AlertTriangle } from 'lucide-react';
import { getAge } from '@/lib/utils';
import type { LabOrder } from '@/types';

export function LabOrderPatientInfo({ order }: { order: LabOrder }) {
  const p = order.patient;
  if (!p) return null;

  const age = p.dateOfBirth ? getAge(p.dateOfBirth) : null;

  return (
    <div className="mt-1 space-y-0.5">
      <p className="text-xs text-muted-foreground truncate">
        {p.firstName} {p.lastName} · {p.mrn}
        {age !== null ? ` · ${age}y` : ''}
        {p.gender ? ` · ${p.gender}` : ''}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {p.bloodGroup && p.bloodGroup !== 'unknown' && (
          <span className="text-[10px] font-medium uppercase rounded bg-muted px-1.5 py-0.5">
            Blood {p.bloodGroup}
          </span>
        )}
        {p.allergies && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-red-700">
            <AlertTriangle className="size-3" /> Allergies: {p.allergies}
          </span>
        )}
        {p.chronicConditions && (
          <span className="text-[10px] font-medium rounded bg-muted px-1.5 py-0.5">
            Chronic: {p.chronicConditions}
          </span>
        )}
        {order.orderedByDoctorName && (
          <span className="text-[10px] text-muted-foreground">
            Ordered by {order.orderedByDoctorName}
          </span>
        )}
      </div>
    </div>
  );
}
