import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('cashier', 'admin')
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Get()
  @Roles('cashier', 'admin', 'receptionist')
  findAll() {
    return this.invoicesService.findAll();
  }

  @Get(':id')
  @Roles('cashier', 'admin')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Get('patient/:patientId')
  @Roles('cashier', 'admin')
  findByPatient(@Param('patientId') patientId: string) {
    return this.invoicesService.findByPatient(patientId);
  }

  @Get('auto-fill/:patientId')
  @Roles('cashier', 'admin')
  getAutoFill(@Param('patientId') patientId: string) {
    return this.invoicesService.getAutoFill(patientId);
  }

  @Patch(':id/pay')
  @Roles('cashier', 'admin')
  pay(@Param('id') id: string, @Body() dto: PayInvoiceDto) {
    return this.invoicesService.pay(id, dto);
  }
}
