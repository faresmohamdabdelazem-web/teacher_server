import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InstallmentService } from './installment.service';
import { Installment } from './entities/installment.entity';

@Controller('installments')
export class InstallmentController {
  constructor(private readonly installmentService: InstallmentService) {}

  @Get()
  findAll(): Promise<Installment[]> {
    return this.installmentService.findAll();
  }

  
  @Get('student/:studentId')
  findByStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<Installment[]> {
    return this.installmentService.findByStudent(studentId);
  }

  
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Installment> {
    const installment = await this.installmentService.findOne(id);
    if (!installment) {
      throw new NotFoundException(`Installment with ID "${id}" not found`);
    }
    return installment;
  }
}