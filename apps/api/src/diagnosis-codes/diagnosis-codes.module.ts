import { Module } from '@nestjs/common';
import { DiagnosisCodesService } from './diagnosis-codes.service';
import { DiagnosisCodesController } from './diagnosis-codes.controller';

@Module({
  controllers: [DiagnosisCodesController],
  providers: [DiagnosisCodesService],
  exports: [DiagnosisCodesService],
})
export class DiagnosisCodesModule {}
