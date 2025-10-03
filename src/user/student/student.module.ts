import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { Student } from './student.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { NotificationModule } from '../../notification/notification.module';
import { InstallmentModule } from 'src/Installment/installment.module';
// --- بداية التعديلات ---
import { SectionModule } from 'src/section/section.module'; // 1. استيراد وحدة الأقسام
import { BranchModule } from 'src/branch/branch.module';   // 2. استيراد وحدة الفروع
import { Section } from 'src/section/entities/section.entity';
import { Branch } from 'src/branch/entities/branch.entity';
// --- نهاية التعديلات ---

@Module({
  imports: [
    // --- بداية التعديلات ---
    TypeOrmModule.forFeature([Student,Section,Branch]), // 3. اجعل هذه الوحدة مسؤولة عن كيان الطالب فقط
    SectionModule,  // 4. قم بإضافة الوحدات هنا
    BranchModule,   // 5. قم بإضافة الوحدات هنا
    // --- نهاية التعديلات ---
    CloudinaryModule,
    NotificationModule,
    InstallmentModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}