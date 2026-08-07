import { IsEmail, IsString, MinLength, IsIn, IsOptional, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsIn(['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'cashier'])
  role: string;
}
