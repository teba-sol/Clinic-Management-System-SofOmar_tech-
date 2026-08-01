import { Module } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { VitalsController } from './vitals.controller';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [AppointmentsModule],
  providers: [VitalsService],
  controllers: [VitalsController],
  exports: [VitalsService],
})
export class VitalsModule {}
