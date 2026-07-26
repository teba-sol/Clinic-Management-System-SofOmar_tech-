import { IsString, IsOptional, IsIn, IsDateString, IsEmail } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsIn(['male', 'female', 'other'])
  gender: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'])
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  chronicConditions?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;
}
