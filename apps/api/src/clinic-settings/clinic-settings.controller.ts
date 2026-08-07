import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ClinicSettingsService } from './clinic-settings.service';
import { UpdateClinicSettingsDto } from './dto/update-clinic-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('clinic-settings')
export class ClinicSettingsController {
  constructor(private readonly clinicSettingsService: ClinicSettingsService) {}

  @Get('public')
  getPublic() {
    return this.clinicSettingsService.get();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  get() {
    return this.clinicSettingsService.get();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Body() dto: UpdateClinicSettingsDto) {
    return this.clinicSettingsService.update(dto);
  }
}
