import { IsUUID, IsOptional, IsArray, ValidateNested, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceItemDto {
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  visitId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}
