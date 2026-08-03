import { Module } from '@nestjs/common';
import { LabOrdersService } from './lab-orders.service';
import { LabOrdersController } from './lab-orders.controller';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [AppointmentsModule],
  providers: [LabOrdersService],
  controllers: [LabOrdersController]
})
export class LabOrdersModule {}
