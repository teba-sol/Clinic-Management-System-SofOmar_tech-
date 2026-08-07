import { Module } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { ClinicSettingsModule } from '../clinic-settings/clinic-settings.module';

@Module({
  imports: [ClinicSettingsModule],
  providers: [PrescriptionsService],
  controllers: [PrescriptionsController]
})
export class PrescriptionsModule {}
