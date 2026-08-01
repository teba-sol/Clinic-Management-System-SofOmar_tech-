import { Module } from '@nestjs/common';
import { QueueDisplayController } from './queue-display.controller';

@Module({
  controllers: [QueueDisplayController],
})
export class QueueDisplayModule {}
