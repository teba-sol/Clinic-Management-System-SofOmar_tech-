import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  @Roles('admin', 'cashier', 'receptionist', 'doctor', 'nurse')
  findAll() {
    return this.servicesService.findAll();
  }

  @Get('active')
  @Roles('admin', 'cashier', 'receptionist', 'doctor', 'nurse')
  findActive() {
    return this.servicesService.findActive();
  }

  @Get(':id')
  @Roles('admin', 'cashier', 'receptionist', 'doctor', 'nurse')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }
}
