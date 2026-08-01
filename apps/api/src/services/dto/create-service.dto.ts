import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsNumber()
  @Min(0)
  defaultPrice: number;

  @IsOptional()
  active?: boolean;
}
