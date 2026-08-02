import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  BadRequestException,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream, existsSync } from 'fs';
import { basename, join } from 'path';
import type { Response } from 'express';
import { LabOrdersService } from './lab-orders.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { labResultFileStorage, UPLOADS_ROOT } from './upload.config';
import { generateLabReportPdf } from './utils/generate-lab-report-pdf';

@Controller('lab-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabOrdersController {
  constructor(private readonly labOrdersService: LabOrdersService) {}

  @Post()
  @Roles('doctor')
  create(@Body() dto: CreateLabOrderDto) {
    return this.labOrdersService.create(dto);
  }

  @Get()
  @Roles('admin', 'doctor', 'nurse', 'lab_tech')
  findAll() {
    return this.labOrdersService.findAll();
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

  @Get(':id/pdf')
  @Roles('admin', 'doctor', 'nurse', 'lab_tech')
  async generatePdf(@Param('id') id: string) {
    const order = await this.labOrdersService.findOne(id);
    const pdf = await generateLabReportPdf({
      patientName:
        `${order.patient?.firstName ?? ''} ${order.patient?.lastName ?? ''}`.trim() ||
        'Unknown patient',
      patientMrn: order.patient?.mrn ?? '-',
      doctorName: order.orderedByDoctorName ?? '-',
      testType: order.testType,
      status: order.status,
      resultText: order.resultText ?? '',
      date: new Date(order.createdAt).toLocaleString(),
    });
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `inline; filename="lab-report-${id}.pdf"`,
    });
  }

  @Post(':id/result-file')
  @Roles('lab_tech', 'admin')
  @UseInterceptors(FileInterceptor('file', { storage: labResultFileStorage }))
  async uploadResultFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.labOrdersService.updateResultFile(id, file.filename);
  }

  @Get(':id/result-file')
  @Roles('admin', 'doctor', 'nurse', 'lab_tech')
  async getResultFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const order = await this.labOrdersService.findOne(id);
    if (!order.resultPdfUrl)
      throw new NotFoundException('No result file attached');
    const safeName = basename(order.resultPdfUrl);
    const filePath = join(UPLOADS_ROOT, safeName);
    if (!existsSync(filePath))
      throw new NotFoundException('Result file missing');
    res.setHeader('Content-Type', 'application/octet-stream');
    return new StreamableFile(createReadStream(filePath), {
      disposition: `attachment; filename="${safeName}"`,
    });
  }

  @Patch(':id')
  @Roles('lab_tech', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateLabOrderDto) {
    return this.labOrdersService.update(id, dto);
  }
}
