import { IsUUID, IsIn, IsMilitaryTime, IsInt, Min, IsOptional } from 'class-validator';

export class CreateScheduleDto {
  @IsUUID()
  doctorId: string;

  @IsIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
  dayOfWeek: string;

  @IsMilitaryTime()
  startTime: string;

  @IsMilitaryTime()
  endTime: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  slotDurationMinutes?: number;
}
