import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { vitals, appointments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CreateVitalDto } from './dto/create-vital.dto';
import { UpdateVitalDto } from './dto/update-vital.dto';
import { AppointmentsService } from '../appointments/appointments.service';
import { AppointmentsGateway } from '../appointments/appointments.gateway';

@Injectable()
export class VitalsService {
  constructor(
    private appointmentsService: AppointmentsService,
    private gateway: AppointmentsGateway,
  ) {}

  async create(dto: CreateVitalDto) {
    const bmi = this.computeBmi(dto.weight, dto.height);

    const [vital] = await db
      .insert(vitals)
      .values({
        appointmentId: dto.appointmentId,
        patientId: dto.patientId,
        recordedByNurseId: dto.recordedByNurseId,
        bloodPressure: dto.bloodPressure,
        temperature: dto.temperature,
        pulse: dto.pulse,
        weight: dto.weight,
        height: dto.height,
        bmi: bmi?.toString() ?? null,
        chiefComplaint: dto.chiefComplaint,
        notes: dto.notes,
      })
      .returning();

    await this.appointmentsService.updateStatus(
      dto.appointmentId,
      'triaged',
      'nurse',
    );

    await db
      .update(appointments)
      .set({ returnedForRecheck: false })
      .where(eq(appointments.id, dto.appointmentId));

    return vital;
  }

  async findByAppointment(appointmentId: string) {
    return db.select().from(vitals).where(eq(vitals.appointmentId, appointmentId));
  }

  async findLatestByAppointment(appointmentId: string) {
    const rows = await db
      .select()
      .from(vitals)
      .where(eq(vitals.appointmentId, appointmentId))
      .orderBy(vitals.createdAt);
    return rows[rows.length - 1] ?? null;
  }

  async findByPatient(patientId: string) {
    return db.select().from(vitals).where(eq(vitals.patientId, patientId)).orderBy(vitals.createdAt);
  }

  async update(vitalId: string, dto: UpdateVitalDto, userId: string) {
    const [vital] = await db.select().from(vitals).where(eq(vitals.id, vitalId));
    if (!vital) throw new NotFoundException('Vital record not found');

    if (vital.recordedByNurseId !== userId) {
      throw new BadRequestException('You can only update your own vitals records');
    }

    const [appt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, vital.appointmentId));
    if (!appt || appt.status !== 'triaged') {
      throw new BadRequestException(
        'Vitals can only be edited while the appointment is in triaged status',
      );
    }

    const bmi = this.computeBmi(
      dto.weight ?? vital.weight ?? undefined,
      dto.height ?? vital.height ?? undefined,
    );

    const updateData: Record<string, any> = {};
    const fields: (keyof UpdateVitalDto)[] = [
      'bloodPressure', 'temperature', 'pulse',
      'weight', 'height', 'chiefComplaint', 'notes',
    ];
    for (const field of fields) {
      if (dto[field] !== undefined) {
        updateData[field] = dto[field];
      }
    }
    if (bmi !== null) updateData.bmi = bmi.toString();

    const [updated] = await db
      .update(vitals)
      .set(updateData)
      .where(eq(vitals.id, vitalId))
      .returning();

    await db
      .update(appointments)
      .set({ returnedForRecheck: false })
      .where(eq(appointments.id, vital.appointmentId));

    return updated;
  }

  private computeBmi(weight?: string, height?: string): number | null {
    if (!weight || !height) return null;
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h) || h === 0) return null;
    return Math.round((w / ((h / 100) * (h / 100))) * 10) / 10;
  }
}
