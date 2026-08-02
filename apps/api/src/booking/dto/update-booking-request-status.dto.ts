import { IsIn } from 'class-validator';

export class UpdateBookingRequestStatusDto {
  @IsIn(['pending', 'contacted', 'converted', 'declined'])
  status: 'pending' | 'contacted' | 'converted' | 'declined';
}
