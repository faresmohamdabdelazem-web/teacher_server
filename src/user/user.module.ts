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
import { NotificationModule } from 'src/notification/notification.module';
import { WhatsAppService } from 'src/notification/whatsapp.service';
import { InstallmentModule } from 'src/Installment/installment.module';
import { Installment } from 'src/Installment/entities/installment.entity'; // <-- الخطوة 1: استيراد الكيان
import { Branch } from 'src/branch/entities/branch.entity';
import { SectionModule } from 'src/section/section.module';
import { Section } from 'src/section/entities/section.entity';
import { BranchModule } from 'src/branch/branch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Teacher,
      Student,
      Assistant,
      Branch,
      Section,
      Lesson,
      LessonAttendance,
      Installment, // <-- الخطوة 2: أضف Installment هنا
    ]),
    CloudinaryModule,
    InstallmentModule,
    NotificationModule,
    SectionModule,
    BranchModule,
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
    WhatsAppService,
  ],
  exports: [
    UserService,
    UserRepository,
    TeacherService,
    StudentService,
    AssistantService,
    WhatsAppService,
  ],
})
export class UserModule {}