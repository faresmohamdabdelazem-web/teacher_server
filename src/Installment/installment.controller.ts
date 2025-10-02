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

  // تم حذف دالة POST /create لأن إنشاء الأقساط أصبح تلقائيًا
  // ويتم التحكم فيه بالكامل من خلال StudentService.

  /**
   * جلب جميع الأقساط في النظام
   */
  @Get()
  findAll(): Promise<Installment[]> {
    return this.installmentService.findAll();
  }

  /**
   * جلب جميع الأقساط لطالب معين
   */
  @Get('student/:studentId')
  findByStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<Installment[]> {
    return this.installmentService.findByStudent(studentId);
  }

  /**
   * جلب قسط واحد عن طريق الـ ID الخاص به
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Installment> {
    const installment = await this.installmentService.findOne(id);
    if (!installment) {
      throw new NotFoundException(`Installment with ID "${id}" not found`);
    }
    return installment;
  }
}