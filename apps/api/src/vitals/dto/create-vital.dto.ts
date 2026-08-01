import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateVitalDto {
  @IsUUID()
  appointmentId: string;

  @IsUUID()
  patientId: string;

  @IsUUID()
  recordedByNurseId: string;

  @IsString()
  @IsOptional()
  bloodPressure?: string;

  @IsString()
  @IsOptional()
  temperature?: string;

  @IsString()
  @IsOptional()
  pulse?: string;

  @IsString()
  @IsOptional()
  weight?: string;

  @IsString()
  @IsOptional()
  height?: string;

  @IsString()
  @IsOptional()
  chiefComplaint?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
