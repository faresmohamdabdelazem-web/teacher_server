import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { Student } from './student.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { NotificationModule } from '../../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([Student]), CloudinaryModule, NotificationModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {} 