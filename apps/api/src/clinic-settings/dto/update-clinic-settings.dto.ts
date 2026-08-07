import { IsOptional, IsString, IsArray, IsIn, Matches, MaxLength } from 'class-validator';

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export class UpdateClinicSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clinicName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsArray()
  @IsIn(WEEK_DAYS, { each: true })
  workingDays?: string[];

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'workingHoursStart must be HH:mm' })
  workingHoursStart?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'workingHoursEnd must be HH:mm' })
  workingHoursEnd?: string;

  @IsOptional()
  @IsArray()
  holidays?: Array<{ date: string; label: string }>;

  @IsOptional()
  @IsString()
  logoData?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  logoMimeType?: string;
}
