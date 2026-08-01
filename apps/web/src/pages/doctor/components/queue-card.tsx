import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Stethoscope, ArrowRight, Check, X } from 'lucide-react';
import type { Appointment, Patient } from '@/types';

interface QueueCardProps {
  appointment: Appointment;
  patient: Patient | undefined;
  visitCount?: number;
  lastVisitDate?: string | null;
  onCheckIn?: (appt: Appointment) => void;
  onMarkNoShow?: (appt: Appointment) => void;
  onStartVisit?: (appt: Appointment) => void;
  onContinue?: (appt: Appointment) => void;
  onView?: (appt: Appointment) => void;
  isPending?: boolean;
}

export function QueueCard({
  appointment,
  patient,
  visitCount = 0,
  lastVisitDate = null,
  onCheckIn,
  onMarkNoShow,
  onStartVisit,
  onContinue,
  onView,
  isPending,
}: QueueCardProps) {
  const age = patient
    ? Math.floor(
        (Date.now() - new Date(patient.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      )
    : null;

  return (
    <Card
      className={`transition-all duration-300 overflow-hidden ${
        appointment.status === 'in_progress'
          ? 'ring-2 ring-amber-400 bg-amber-50/50'
          : appointment.status === 'completed'
          ? 'opacity-70'
          : 'hover:shadow-md'
      }`}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex items-center justify-center size-12 rounded-xl text-lg font-bold shrink-0 ${
              appointment.status === 'in_progress'
                ? 'bg-amber-500 text-white animate-pulse'
                : appointment.status === 'completed'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-primary/10 text-primary'
            }`}
          >
            #{appointment.queueNumber}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm truncate">
                  {patient
                    ? `${patient.firstName} ${patient.lastName}`
                    : 'Unknown Patient'}
                </p>
                {patient && (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono">{patient.mrn}</span>
                      {age !== null && (
                        <>
                          <span>·</span>
                          <span>{age}y</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="capitalize">{patient.gender}</span>
                      {visitCount > 0 && lastVisitDate && (
                        <>
                          <span>·</span>
                          <span>{Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))}d ago</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {visitCount === 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                          New Patient
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                          Follow-up #{visitCount}
                        </span>
                      )}
                    </div>
                  </>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(appointment.scheduledAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <StatusBadge status={appointment.status} />
            </div>

            <div className="flex items-center gap-2 mt-3">
              {appointment.status === 'booked' && (onCheckIn || onMarkNoShow) && (
                <>
                  {onCheckIn && (
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 gap-1.5 h-8 text-xs"
                      onClick={() => onCheckIn(appointment)}
                      disabled={isPending}
                    >
                      <Check className="size-3" />
                      Check In
                    </Button>
                  )}
                  {onMarkNoShow && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => onMarkNoShow(appointment)}
                      disabled={isPending}
                    >
                      <X className="size-3" />
                      No-show
                    </Button>
                  )}
                </>
              )}
              {(appointment.status === 'checked_in' || appointment.status === 'triaged') && onStartVisit && (
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 h-8 text-xs"
                  onClick={() => onStartVisit(appointment)}
                  disabled={isPending}
                >
                  <Play className="size-3" />
                  {isPending ? 'Starting...' : 'Start Visit'}
                </Button>
              )}
              {appointment.status === 'in_progress' && onContinue && (
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 h-8 text-xs"
                  onClick={() => onContinue(appointment)}
                >
                  <ArrowRight className="size-3" />
                  Continue Visit
                </Button>
              )}
              {appointment.status === 'completed' && onView && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 h-8 text-xs"
                  onClick={() => onView(appointment)}
                >
                  <Stethoscope className="size-3" />
                  View Visit
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
