import { BadRequestException, ConflictException } from '@nestjs/common';
import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { appointments, users, patients } from '../db/schema';
import {
  ACTIVE_APPOINTMENT_FILTER,
  formatMinutes,
  generateSlotTimes,
  getDoctorActiveAppointmentsOnDate,
  getDoctorDaySchedules,
  sameSlot,
} from './slot-utils';

export interface BookingValidationInput {
  doctorId: string;
  scheduledAt: Date;
  patientId?: string;
  excludeAppointmentId?: string;
}

/**
 * Validates a booking request before it is persisted:
 * - scheduledAt must be a valid, future timestamp
 * - doctor must exist, be active and have role 'doctor'
 * - patient must exist (when provided)
 * - scheduledAt must exactly match one of the doctor's generated slot start
 *   times for that date (startTime + slotDurationMinutes steps, fully inside
 *   the schedule window)
 * - the slot must not already be taken for the same doctor by another active
 *   appointment (cancelled / no_show appointments free up the slot)
 * - the patient must not already have an appointment in that same slot
 */
export async function validateBooking({
  doctorId,
  scheduledAt,
  patientId,
  excludeAppointmentId,
}: BookingValidationInput): Promise<void> {
  if (isNaN(scheduledAt.getTime())) {
    throw new BadRequestException('Invalid scheduled time');
  }
  if (scheduledAt.getTime() <= Date.now()) {
    throw new BadRequestException('Appointment time cannot be in the past');
  }

  const [doctor] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, doctorId), eq(users.role, 'doctor'), eq(users.isActive, true)));
  if (!doctor) {
    throw new BadRequestException('Selected doctor is not available');
  }

  if (patientId) {
    const [patient] = await db.select().from(patients).where(eq(patients.id, patientId));
    if (!patient) {
      throw new BadRequestException('Patient not found');
    }
  }

  const windows = await getDoctorDaySchedules(doctorId, scheduledAt);
  if (windows.length === 0) {
    throw new BadRequestException('The selected doctor has no schedule on this day');
  }

  const slotTimes = generateSlotTimes(windows);
  const requestedSlot = formatMinutes(scheduledAt.getHours() * 60 + scheduledAt.getMinutes());
  if (!slotTimes.includes(requestedSlot)) {
    throw new BadRequestException(
      'scheduledAt must match one of the doctor\'s available slots for that date',
    );
  }

  const bookedRows = await getDoctorActiveAppointmentsOnDate(doctorId, scheduledAt);
  const existingDoctor = bookedRows.find(
    (a) =>
      !(excludeAppointmentId && a.id === excludeAppointmentId) &&
      sameSlot(scheduledAt, a.scheduledAt),
  );
  if (existingDoctor) {
    throw new ConflictException('This time slot is already booked for the selected doctor');
  }

  if (patientId) {
    const startOfDay = new Date(scheduledAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduledAt);
    endOfDay.setHours(23, 59, 59, 999);

    const existingPatient = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.patientId, patientId),
          gte(appointments.scheduledAt, startOfDay),
          lte(appointments.scheduledAt, endOfDay),
          ACTIVE_APPOINTMENT_FILTER,
        ),
      );

    const patientConflict = existingPatient.find(
      (a) =>
        !(excludeAppointmentId && a.id === excludeAppointmentId) &&
        sameSlot(scheduledAt, a.scheduledAt),
    );
    if (patientConflict) {
      throw new ConflictException('Patient already has an appointment at this time');
    }
  }
}
