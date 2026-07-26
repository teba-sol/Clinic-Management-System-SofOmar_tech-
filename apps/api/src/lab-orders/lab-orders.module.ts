import { Module } from '@nestjs/common';
import { LabOrdersService } from './lab-orders.service';
import { LabOrdersController } from './lab-orders.controller';

@Module({
  providers: [LabOrdersService],
  controllers: [LabOrdersController]
})
export class LabOrdersModule {}
