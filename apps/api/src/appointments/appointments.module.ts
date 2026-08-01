import { Module, forwardRef } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsGateway } from './appointments.gateway';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsGateway],
  exports: [AppointmentsService, AppointmentsGateway],
})
export class AppointmentsModule {}
