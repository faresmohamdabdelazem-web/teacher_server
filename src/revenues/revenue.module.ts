import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Revenue } from './entities/revenues.entity';
import { RevenueService } from './revenue.service';
import { RevenueController } from './revenue.controller';
import { Section } from 'src/section/entities/section.entity';
import { Student } from 'src/user/student/student.entity';
import { Installment } from 'src/installment/entities/installment.entity';
import { Branch } from 'src/branch/entities/branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Revenue, 
      Section, // لاستخدامه في السيرفس لجلب إيرادات الأقسام
      Student, // لاستخدامه في السيرفس لربط الإيرادات بالطلاب
      Installment,
      Branch // لاستخدامه عند تسجيل إيراد من قسط
    ]),
  ],
  controllers: [RevenueController],
  providers: [RevenueService],
  exports: [RevenueService], // قم بعمل export للسيرفس إذا احتجت استخدامه في وحدات أخرى
})
export class RevenueModule {}