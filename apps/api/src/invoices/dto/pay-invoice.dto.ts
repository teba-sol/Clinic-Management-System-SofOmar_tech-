import { IsNumber, Min, IsIn } from 'class-validator';

export class PayInvoiceDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsIn(['cash', 'telebirr', 'cbe_birr', 'insurance'])
  paymentMethod: string;
}
