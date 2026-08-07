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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';
import type { Response } from 'express';
import { LabOrdersService } from './lab-orders.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { labResultFileStorage, UPLOADS_ROOT } from './upload.config';
import { generateLabReportPdf } from './utils/generate-lab-report-pdf';
import { decryptFile, encryptFile } from './utils/file-crypto';
import { ClinicSettingsService } from '../clinic-settings/clinic-settings.service';

@Controller('lab-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabOrdersController {
  constructor(
    private readonly labOrdersService: LabOrdersService,
    private readonly clinicSettingsService: ClinicSettingsService,
  ) {}

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
    const settings = await this.clinicSettingsService.get();
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
      clinicName: settings.clinicName || 'SofOmar Clinic',
      clinicAddress: settings.address || 'Addis Ababa, Ethiopia',
      clinicPhone: settings.phone || '+251 9XX XXX XXX',
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
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File exceeds 5MB limit');
    }
    const safeExt = extname(file.originalname).toLowerCase() || '.bin';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    if (!existsSync(UPLOADS_ROOT)) {
      mkdirSync(UPLOADS_ROOT, { recursive: true });
    }
    writeFileSync(join(UPLOADS_ROOT, filename), encryptFile(file.buffer));
    return this.labOrdersService.updateResultFile(id, filename);
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

    const decrypted = decryptFile(readFileSync(filePath));
    const ext = extname(safeName).toLowerCase();
    const contentType =
      ext === '.pdf'
        ? 'application/pdf'
        : ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)
          ? `image/${ext.slice(1)}`
          : 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    return new StreamableFile(decrypted, {
      disposition: `attachment; filename="${safeName}"`,
    });
  }

  @Patch(':id')
  @Roles('lab_tech', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateLabOrderDto) {
    return this.labOrdersService.update(id, dto);
  }
}
