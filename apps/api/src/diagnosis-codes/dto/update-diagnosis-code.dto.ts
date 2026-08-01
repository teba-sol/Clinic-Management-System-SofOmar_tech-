import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateDiagnosisCodeDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
