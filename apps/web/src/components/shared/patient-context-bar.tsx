import { useNavigate } from 'react-router-dom';
import { X, SwitchCamera } from 'lucide-react';
import { usePatientContext } from '@/context/patient-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getAge } from '@/lib/utils';

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function PatientContextBar() {
  const { patient, visit, clearContext } = usePatientContext();
  const navigate = useNavigate();

  if (!patient) return null;

  const age = patient.dateOfBirth ? getAge(patient.dateOfBirth) : null;

  return (
    <div className="sticky top-16 z-20 -mx-4 lg:-mx-8 px-4 lg:px-8 py-2 bg-background border-b border-primary/10 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar className="size-9 border-2 border-primary/20">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            {getInitials(patient.firstName, patient.lastName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">
              {patient.firstName} {patient.lastName}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{patient.mrn}</span>
            {age !== null && (
              <Badge variant="outline" className="text-[10px] font-normal h-4 px-1.5">
                {age}y
              </Badge>
            )}
            {patient.gender && (
              <Badge variant="outline" className="text-[10px] font-normal h-4 px-1.5 capitalize">
                {patient.gender}
              </Badge>
            )}
          </div>
          {visit && (
            <p className="text-xs text-muted-foreground">
              Visit active — {visit.diagnosisDescription || 'SOAP in progress'}
            </p>
          )}
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            clearContext();
            navigate('/patients');
          }}
          className="gap-1.5 shrink-0"
        >
          <SwitchCamera className="size-3.5" />
          <span className="text-xs">Switch</span>
        </Button>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={clearContext}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
