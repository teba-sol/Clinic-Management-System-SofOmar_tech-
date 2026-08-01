import { IsOptional, IsUUID, IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PrescriptionItemDto {
  @IsString()
  drugName: string;

  @IsString()
  dosage: string;

  @IsString()
  frequency: string;

  @IsString()
  route: string;

  @IsString()
  duration: string;
}

export class CreatePrescriptionDto {
  @IsOptional()
  @IsUUID()
  visitId?: string;

  @IsUUID()
  patientId: string;

  @IsUUID()
  doctorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];
}
