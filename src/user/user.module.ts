import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UserRepository } from './user.repository';
import { Teacher } from './teacher/teacher.entity';
import { Student } from './student/student.entity';
import { Assistant } from './assistant/assistant.entity';
import { Lesson } from '../lesson/entities/lesson.entity';
import { LessonAttendance } from '../lesson/entities/lesson-attendance.entity';
import { TeacherService } from './teacher/teacher.service';
import { StudentService } from './student/student.service';
import { AssistantService } from './assistant/assistant.service';
import { TeacherController } from './teacher/teacher.controller';
import { StudentController } from './student/student.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Teacher,
      Student,
      Assistant,
      Lesson,
      LessonAttendance,
    ]),
    CloudinaryModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [
    UserController,
    TeacherController,
    StudentController,
  ],
  providers: [
    UserService, 
    CloudinaryService, 
    UserRepository,
    TeacherService,
    StudentService,
    AssistantService,
  ],
  exports: [
    UserService, 
    UserRepository,
    TeacherService,
    StudentService,
    AssistantService,
  ],
})
export class UserModule {}
