import { IsUUID, IsString } from 'class-validator';

export class CreateLabOrderDto {
  @IsUUID()
  visitId: string;

  @IsUUID()
  patientId: string;

  @IsUUID()
  orderedByDoctorId: string;

  @IsString()
  testType: string;
}
