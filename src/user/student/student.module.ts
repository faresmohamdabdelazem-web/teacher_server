import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { Student } from './student.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { NotificationModule } from '../../notification/notification.module';
import { InstallmentModule } from 'src/Installment/installment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student]),
    CloudinaryModule,
    NotificationModule,
    InstallmentModule, // ✅ استوردنا الـ module اللي بيصدر InstallmentService
  ],
  controllers: [StudentController],
  providers: [StudentService], // ما تضيفش InstallmentService هنا
  exports: [StudentService],
})
export class StudentModule {}
