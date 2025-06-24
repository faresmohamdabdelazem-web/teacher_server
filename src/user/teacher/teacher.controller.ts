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

@UseGuards(AuthGuard, RoleGuard)
@Controller('teachers')
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly userService: UserService,
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

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id/students')
  getTeacherStudents(@Param('id') id: string) {
    return this.teacherService.getTeacherStudents(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id/lessons')
  getTeacherLessons(@Param('id') id: string) {
    return this.teacherService.getTeacherLessons(id);
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
      },
    };
  }
} 