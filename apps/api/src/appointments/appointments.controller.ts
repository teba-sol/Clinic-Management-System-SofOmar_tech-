import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('admin', 'receptionist')
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get('queue/:doctorId')
  @Roles('admin', 'receptionist', 'doctor', 'nurse')
  getQueue(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.getQueueForDoctor(doctorId);
  }
}
