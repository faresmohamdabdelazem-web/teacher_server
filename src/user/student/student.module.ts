import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { Student } from './student.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { NotificationModule } from '../../notification/notification.module';
import { InstallmentModule } from 'src/Installment/installment.module';
import { LessonModule } from 'src/lesson/lesson.module';
import { LessonAttendance } from 'src/lesson/entities/lesson-attendance.entity';
import { SectionModule } from 'src/section/section.module';
import { BranchModule } from 'src/branch/branch.module';
import { Section } from 'src/section/entities/section.entity';
import { Branch } from 'src/branch/entities/branch.entity';
import { RevenueModule } from 'src/revenues/revenue.module';
import { Installment } from "../../Installment/entities/installment.entity";
import { Assistant } from '../assistant';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Section, Branch, Installment, LessonAttendance,Assistant]),
    SectionModule,
    BranchModule,
    RevenueModule,
    CloudinaryModule,
    NotificationModule,
    forwardRef(() => LessonModule), // ✅ تم التعديل هنا
    InstallmentModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
