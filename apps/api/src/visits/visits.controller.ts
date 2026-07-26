import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  @Roles('doctor', 'nurse')
  create(@Body() dto: CreateVisitDto) {
    return this.visitsService.create(dto);
  }

  @Get('patient/:patientId')
  @Roles('doctor', 'nurse', 'admin')
  findByPatient(@Param('patientId') patientId: string) {
    return this.visitsService.findByPatient(patientId);
  }

  @Get(':id')
  @Roles('doctor', 'nurse', 'admin')
  findOne(@Param('id') id: string) {
    return this.visitsService.findOne(id);
  }
}
