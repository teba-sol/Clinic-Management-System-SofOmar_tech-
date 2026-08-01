import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles('admin', 'receptionist', 'nurse')
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Get()
  @Roles('admin', 'receptionist', 'nurse', 'doctor', 'cashier')
  findAll() {
    return this.patientsService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'receptionist', 'nurse', 'doctor', 'cashier')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }
}
