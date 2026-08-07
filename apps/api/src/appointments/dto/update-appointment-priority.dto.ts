import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateAppointmentPriorityDto {
  @IsIn(['routine', 'urgent', 'emergency'])
  priority: 'routine' | 'urgent' | 'emergency';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
