import { Module ,forwardRef} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { Lesson } from './entities/lesson.entity';
import { LessonAttendance } from './entities/lesson-attendance.entity';
import { TeacherStats } from './entities/teacher-stats.entity';
import { TeacherStatsService } from './teacher-stats.service';
import { Teacher } from '../user/teacher/teacher.entity';
import { Student } from '../user/student/student.entity';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';
import { StudentModule } from "../user/student/student.module";
import { Installment } from "../Installment/entities/installment.entity"
import { Assistant } from 'src/user/assistant/assistant.entity';
import { Section } from 'src/section/entities/section.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson, LessonAttendance, Teacher, Student, TeacherStats,Installment,Assistant,Section]),
    forwardRef(() => UserModule),
    NotificationModule,
    forwardRef(() => StudentModule)
  ],
  controllers: [LessonController],
  providers: [LessonService, TeacherStatsService],
  exports: [LessonService, TeacherStatsService],
})
export class LessonModule {} 