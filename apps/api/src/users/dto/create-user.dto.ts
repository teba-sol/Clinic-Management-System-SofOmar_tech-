import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsIn(['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'cashier'])
  role: string;
}
