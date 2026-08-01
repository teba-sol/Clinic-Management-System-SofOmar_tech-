import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DiagnosisCodesService } from './diagnosis-codes.service';
import { CreateDiagnosisCodeDto } from './dto/create-diagnosis-code.dto';
import { UpdateDiagnosisCodeDto } from './dto/update-diagnosis-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('diagnosis-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiagnosisCodesController {
  constructor(private readonly diagnosisCodesService: DiagnosisCodesService) {}

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateDiagnosisCodeDto) {
    return this.diagnosisCodesService.create(dto);
  }

  @Get()
  @Roles('admin', 'doctor', 'nurse')
  findAll() {
    return this.diagnosisCodesService.findAll();
  }

  @Get('active')
  @Roles('admin', 'doctor', 'nurse')
  findActive() {
    return this.diagnosisCodesService.findActive();
  }

  @Get('search')
  @Roles('admin', 'doctor', 'nurse')
  search(@Query('q') q: string) {
    return this.diagnosisCodesService.search(q || '');
  }

  @Get(':id')
  @Roles('admin', 'doctor', 'nurse')
  findOne(@Param('id') id: string) {
    return this.diagnosisCodesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateDiagnosisCodeDto) {
    return this.diagnosisCodesService.update(id, dto);
  }
}
