import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentPriorityDto } from './dto/update-appointment-priority.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('admin', 'receptionist')
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get()
  @Roles('admin', 'receptionist', 'doctor', 'nurse')
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('patient/:patientId')
  @Roles('admin', 'receptionist', 'doctor', 'nurse')
  findByPatient(@Param('patientId') patientId: string) {
    return this.appointmentsService.findByPatient(patientId);
  }

  @Get('available-slots')
  @Public()
  getAvailableSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableSlots(doctorId, date);
  }

  @Get('queue')
  @Roles('admin', 'receptionist', 'doctor', 'nurse')
  getQueue() {
    return this.appointmentsService.getFullQueue();
  }

  @Get('queue/:doctorId')
  @Roles('admin', 'receptionist', 'doctor', 'nurse')
  getQueueForDoctor(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.getQueueForDoctor(doctorId);
  }

  @Get('queue/:doctorId/with-patients')
  @Roles('admin', 'receptionist', 'doctor', 'nurse')
  getQueueWithPatients(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.getQueueWithPatients(doctorId);
  }

  @Patch(':id/status')
  @Roles('admin', 'receptionist', 'doctor', 'nurse')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.updateStatus(id, status, user?.role);
  }

  @Patch(':id/priority')
  @Roles('nurse', 'doctor', 'admin')
  updatePriority(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentPriorityDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.updatePriority(id, dto, user);
  }
}
