import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { CreateVitalDto } from './dto/create-vital.dto';
import { UpdateVitalDto } from './dto/update-vital.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('vitals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Post()
  @Roles('nurse')
  create(@Body() dto: CreateVitalDto) {
    return this.vitalsService.create(dto);
  }

  @Patch(':id')
  @Roles('nurse')
  update(@Param('id') id: string, @Body() dto: UpdateVitalDto, @Req() req: any) {
    return this.vitalsService.update(id, dto, req.user.id);
  }

  @Get('appointment/:appointmentId')
  @Roles('doctor', 'nurse', 'receptionist')
  findByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.vitalsService.findByAppointment(appointmentId);
  }

  @Get('appointment/:appointmentId/latest')
  @Roles('doctor', 'nurse', 'receptionist')
  findLatestByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.vitalsService.findLatestByAppointment(appointmentId);
  }

  @Get('patient/:patientId')
  @Roles('doctor', 'nurse')
  findByPatient(@Param('patientId') patientId: string) {
    return this.vitalsService.findByPatient(patientId);
  }
}
