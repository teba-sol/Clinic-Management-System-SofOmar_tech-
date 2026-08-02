import { IsString, IsNotEmpty, IsOptional, IsEmail, IsIn, IsDateString, IsUUID, MaxLength } from 'class-validator';

export class CreateBookingRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  department: string;

  @IsDateString()
  preferredDate: string;

  @IsIn(['morning', 'afternoon', 'evening'])
  preferredTime: 'morning' | 'afternoon' | 'evening';

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
