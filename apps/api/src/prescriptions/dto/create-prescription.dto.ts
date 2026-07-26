import { IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PrescriptionItemDto {
  drugName: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
}

export class CreatePrescriptionDto {
  @IsUUID()
  visitId: string;

  @IsUUID()
  patientId: string;

  @IsUUID()
  doctorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];
}
