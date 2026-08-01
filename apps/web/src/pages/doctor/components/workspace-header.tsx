import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import type { Patient, Appointment } from '@/types';

interface WorkspaceHeaderProps {
  patient: Patient;
  appointment?: Appointment | null;
  onBack: () => void;
}

export function WorkspaceHeader({
  patient,
  appointment,
  onBack,
}: WorkspaceHeaderProps) {
  const age = Math.floor(
    (Date.now() - new Date(patient.dateOfBirth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000),
  );

  const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`;

  return (
    <div className="sticky top-16 z-20 bg-gradient-to-r from-primary/5 via-background to-primary/5 border-b backdrop-blur-md -mx-4 sm:-mx-8 px-4 sm:px-8 py-3">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 mb-2 -ml-2 h-7 text-xs"
        onClick={onBack}
      >
        <ArrowLeft className="size-3" />
        Back to Queue
      </Button>
      <div className="flex items-center gap-3">
        <Avatar className="size-10 rounded-xl">
          <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-sm font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold truncate">
              {patient.firstName} {patient.lastName}
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              {patient.mrn}
            </span>
            {appointment && <StatusBadge status={appointment.status} />}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{age} years</span>
            <span>·</span>
            <span className="capitalize">{patient.gender}</span>
            {patient.bloodGroup && (
              <>
                <span>·</span>
                <span>Blood: {patient.bloodGroup}</span>
              </>
            )}
          </div>
        </div>
        {patient.allergies && (
          <Badge
            variant="outline"
            className="gap-1 border-red-200 bg-red-50 text-red-700 text-xs shrink-0"
          >
            <AlertTriangle className="size-3" />
            Allergies
          </Badge>
        )}
      </div>
    </div>
  );
}
