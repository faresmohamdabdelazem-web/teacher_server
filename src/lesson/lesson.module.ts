import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from './entities/lesson.entity';
import { LessonAttendance } from './entities/lesson-attendance.entity';
import { Teacher } from '../user/teacher/teacher.entity';
import { Student } from '../user/student/student.entity';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson, LessonAttendance, Teacher, Student]),
    UserModule,
  ],
  controllers: [LessonController],
  providers: [LessonService],
  exports: [TypeOrmModule, LessonService],
})
export class LessonModule {} 