import { Module } from '@nestjs/common';
import { LabOrdersService } from './lab-orders.service';
import { LabOrdersController } from './lab-orders.controller';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ClinicSettingsModule } from '../clinic-settings/clinic-settings.module';

@Module({
  imports: [AppointmentsModule, ClinicSettingsModule],
  providers: [LabOrdersService],
  controllers: [LabOrdersController]
})
export class LabOrdersModule {}
