import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { doctorSchedules, appointments } from '../db/schema';

export const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const DEFAULT_SLOT_DURATION_MINUTES = 20;

export const ACTIVE_APPOINTMENT_FILTER = sql`${appointments.status} NOT IN ('cancelled', 'no_show')`;

export interface SlotWindow {
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function parseDateOnly(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d, 0, 0, 0, 0);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Generates the valid slot start times for a set of schedule windows.
 * Starts at each window's startTime, steps by slotDurationMinutes, and only
 * keeps slots that fully fit before endTime (partial trailing slots are
 * discarded). Times are de-duplicated and sorted.
 */
export function generateSlotTimes(windows: SlotWindow[]): string[] {
  const times = new Set<string>();
  for (const window of windows) {
    const duration = window.slotDurationMinutes || DEFAULT_SLOT_DURATION_MINUTES;
    const startMin = toMinutes(window.startTime);
    const endMin = toMinutes(window.endTime);
    for (let m = startMin; m + duration <= endMin; m += duration) {
      times.add(formatMinutes(m));
    }
  }
  return [...times].sort();
}

export function slotLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return new Date(0, 0, 0, h || 0, m || 0).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function slotDateTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export function sameSlot(primary: Date, other: Date): boolean {
  return primary.getHours() === other.getHours() && primary.getMinutes() === other.getMinutes();
}

export function timeOf(date: Date): string {
  return formatMinutes(date.getHours() * 60 + date.getMinutes());
}

/** Fetches the doctor's schedule windows for the weekday of the given date. */
export async function getDoctorDaySchedules(doctorId: string, date: Date): Promise<SlotWindow[]> {
  const dayOfWeek = DAYS[date.getDay()];
  const rows = await db
    .select()
    .from(doctorSchedules)
    .where(
      and(
        eq(doctorSchedules.doctorId, doctorId),
        eq(doctorSchedules.dayOfWeek, dayOfWeek as any),
      ),
    );
  return rows.map((row) => ({
    startTime: row.startTime,
    endTime: row.endTime,
    slotDurationMinutes: row.slotDurationMinutes ?? DEFAULT_SLOT_DURATION_MINUTES,
  }));
}

/** Fetches active (non-cancelled / non-no-show) appointments for a doctor on a date. */
export async function getDoctorActiveAppointmentsOnDate(doctorId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return db
    .select({ id: appointments.id, scheduledAt: appointments.scheduledAt })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        gte(appointments.scheduledAt, startOfDay),
        lte(appointments.scheduledAt, endOfDay),
        ACTIVE_APPOINTMENT_FILTER,
      ),
    );
}
