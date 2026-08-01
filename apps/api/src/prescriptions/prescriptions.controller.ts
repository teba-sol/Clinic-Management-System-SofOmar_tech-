import { Controller, Get, Post, Body, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  @Roles('doctor', 'nurse', 'admin')
  findAll() {
    return this.prescriptionsService.findAll();
  }

  @Post()
  @Roles('doctor')
  create(@Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(dto);
  }

  @Get('patient/:patientId')
  @Roles('doctor', 'nurse', 'admin')
  findByPatient(@Param('patientId') patientId: string) {
    return this.prescriptionsService.findByPatient(patientId);
  }

  @Get(':id/pdf')
  @Roles('doctor', 'nurse', 'admin')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.prescriptionsService.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="prescription-${id}.pdf"`,
    });
    res.send(pdfBuffer);
  }
}
