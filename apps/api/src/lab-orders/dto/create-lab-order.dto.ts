import { IsUUID, IsString } from 'class-validator';

export class CreateLabOrderDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  orderedByDoctorId: string;

  @IsString()
  testType: string;
}
