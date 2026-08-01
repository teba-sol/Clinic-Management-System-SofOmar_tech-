import { IsString, IsOptional } from 'class-validator';

export class CreateDiagnosisCodeDto {
  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  category?: string;
}
