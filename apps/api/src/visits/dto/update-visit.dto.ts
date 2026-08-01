import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateVisitDto {
  @IsOptional()
  @IsString()
  subjective?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  assessment?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  diagnosisCode?: string;

  @IsOptional()
  @IsString()
  diagnosisDescription?: string;

  @IsOptional()
  @IsString()
  addendum?: string;

  @IsOptional()
  @IsBoolean()
  completeAppointment?: boolean;
}
