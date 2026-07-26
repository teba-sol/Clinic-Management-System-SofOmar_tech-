import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @Get()
  @Roles('admin', 'receptionist', 'doctor', 'nurse')
  findAll() {
    return this.schedulesService.findAll();
  }

  @Get('doctor/:doctorId')
  @Roles('admin', 'receptionist', 'doctor', 'nurse')
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.schedulesService.findByDoctor(doctorId);
  }
}
