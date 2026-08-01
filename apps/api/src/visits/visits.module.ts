import { Module } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [AppointmentsModule],
  providers: [VisitsService],
  controllers: [VisitsController],
  exports: [VisitsService],
})
export class VisitsModule {}
