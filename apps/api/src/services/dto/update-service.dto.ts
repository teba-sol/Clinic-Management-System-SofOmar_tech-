import { IsString, IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultPrice?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
