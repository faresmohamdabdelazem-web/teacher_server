import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  Query,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './create-teacher.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { UserRole } from '../user.role.enum';
import { Roles } from 'src/decorators/role.decorator';
import { UserService } from '../user.service';
import { GetSignedUser } from 'src/decorators/get.signed.user.decorator';
import { UserPayload } from '../userPayload.type';
import { PhoneNumberPipe } from 'src/shared/phone-number.pipe';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { AssistantService } from '../assistant/assistant.service';
import { LessonStatus } from '../../lesson/entities/lesson.entity';
import { StudentService } from '../student/student.service';
import { CreateStudentDto } from '../student/create-student.dto';

@UseGuards(AuthGuard, RoleGuard)
@Controller('teachers')
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly userService: UserService,
    private readonly assistantService: AssistantService,
    private readonly studentService: StudentService,
  ) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createTeacherDto: CreateTeacherDto, @GetSignedUser() user: UserPayload) {
    return this.teacherService.create(createTeacherDto, user as unknown as User);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.teacherService.findAll();
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teacherService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.ASSISTANT)
  @Get(':id/students')
  getTeacherStudents(@Param('id') id: string) {
    return this.teacherService.getTeacherStudents(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.ASSISTANT)
  @Get(':id/lessons')
  getTeacherLessons(
    @Param('id') id: string,
    @Query('date') date?: string,
    @Query('subject') subject?: string,
    @Query('status') status?: LessonStatus,
    @Query('grade') grade?: string
  ) {
    return this.teacherService.getTeacherLessons(id, date, subject, status, grade);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id/assistants')
  async getTeacherAssistants(@Param('id') id: string, @GetSignedUser() user: UserPayload) {
    // Verify that the user is requesting their own assistants or is admin
    const currentUser = await this.userService.findOneById(user.id);
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.userId !== id)) {
      throw new Error('Unauthorized to view these assistants');
    }

    const assistants = await this.assistantService.findByTeacher(id);
    
    return {
      assistants: assistants.map(assistant => ({
        id: assistant.userId,
        firstName: assistant.user.firstName,
        lastName: assistant.user.lastName,
        email: assistant.user.email,
        phone: assistant.user.phone,
        role: assistant.user.role,
        createdAt: assistant.createdAt,
        teacherId: assistant.teacherId,
      })),
    };
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeacherDto: any) {
    return this.teacherService.update(id, updateTeacherDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teacherService.remove(id);
  }

  // Teacher endpoint to create assistants
  @Post('create-assistant')
  @Roles(UserRole.TEACHER)
  async createAssistant(
    @Body() createAssistantData: CreateUserDto,
    @GetSignedUser() user: UserPayload,
  ) {
    // Verify that the user is a teacher
    const currentUser = await this.userService.findOneById(user.id);
    if (!currentUser || currentUser.role !== UserRole.TEACHER) {
      throw new Error('Only teachers can create assistants');
    }

    const assistant = await this.userService.create({
      ...createAssistantData,
      role: UserRole.ASSISTANT,
    });

    // Create assistant entity and assign to the teacher
    const assistantEntity = await this.assistantService.createWithUserAndTeacher(assistant, currentUser.userId);

    return {
      message: 'Assistant created successfully by teacher',
      assistant: {
        id: assistant.userId,
        firstName: assistant.firstName,
        lastName: assistant.lastName,
        email: assistant.email,
        role: assistant.role,
        phone: assistant.phone,
        createdAt: assistant.createdAt,
        teacherId: assistantEntity.teacherId,
      },
    };
  }

 
  @Post('create-student')
  @Roles(UserRole.TEACHER)
  async createStudent(
    @Body() createStudentDto: CreateStudentDto,
    @GetSignedUser() user: UserPayload,
  ) {
  
    
    // Verify that the user is a teacher
    const currentUser = await this.userService.findOneById(user.id);
    if (!currentUser || currentUser.role !== UserRole.TEACHER) {
      throw new Error('Only teachers can create students');
    }
    // Create the student
    const student = await this.studentService.create(createStudentDto);
    // Associate the student with the teacher
    await this.teacherService.addStudentToTeacher(currentUser.userId, student.id);
    return {
      message: 'Student created successfully by teacher',
      student,
    };
  }
} 