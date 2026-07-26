import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { LabOrdersService } from './lab-orders.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('lab-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabOrdersController {
  constructor(private readonly labOrdersService: LabOrdersService) {}

  @Post()
  @Roles('doctor')
  create(@Body() dto: CreateLabOrderDto) {
    return this.labOrdersService.create(dto);
  }

  @Get('pending')
  @Roles('lab_tech', 'admin')
  findPending() {
    return this.labOrdersService.findPending();
  }

  @Get('patient/:patientId')
  @Roles('doctor', 'nurse', 'admin', 'lab_tech')
  findByPatient(@Param('patientId') patientId: string) {
    return this.labOrdersService.findByPatient(patientId);
  }

  @Patch(':id')
  @Roles('lab_tech', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateLabOrderDto) {
    return this.labOrdersService.update(id, dto);
  }
}
