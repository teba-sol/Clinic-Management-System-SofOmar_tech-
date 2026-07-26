import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateLabOrderDto {
  @IsOptional()
  @IsIn(['ordered', 'sample_collected', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  resultText?: string;

  @IsOptional()
  @IsUUID()
  completedByLabTechId?: string;
}
