import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InstallmentService } from './installment.service';
import { CreateInstallmentDto } from './dto/create-installment.dto';
import { Installment } from './entities/installment.entity';

@Controller('installments')
export class InstallmentController {
  constructor(private readonly installmentService: InstallmentService) {}

  @Post()
  create(@Body() dto: CreateInstallmentDto): Promise<Installment> {
    return this.installmentService.create(dto);
  }

  @Get()
  findAll(): Promise<Installment[]> {
    return this.installmentService.findAll();
  }

  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string): Promise<Installment[]> {
    return this.installmentService.findByStudent(studentId);
  }
}
