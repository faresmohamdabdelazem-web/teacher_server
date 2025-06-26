import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Get,
  Patch,
  Query,
  UsePipes,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UserRole } from './user.role.enum';

import { UserPayload } from './userPayload.type';
import { GetSignedUser } from 'src/decorators/get.signed.user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-user.dto';
import { PhoneNumberPipe } from 'src/shared/phone-number.pipe';
import { ChangePasswordDto } from './dto/change-password.dto';
import { StudentService } from './student/student.service';
import { CreateStudentDto } from './student/create-student.dto';
import { TeacherService } from './teacher/teacher.service';
import { AssistantService } from './assistant/assistant.service';

@Controller('user')
@UseGuards(AuthGuard, RoleGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly studentService: StudentService,
    private readonly teacherService: TeacherService,
    private readonly assistantService: AssistantService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UsePipes(new PhoneNumberPipe())
  findAll(@Query() paginatedRequestDto: FilterUsersDto) {
    return this.userService.findAll(paginatedRequestDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @UsePipes(new PhoneNumberPipe())
  update(
    @Param('id') id: string,
    @GetSignedUser() user: UserPayload,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Patch('/reset/password')
  @Roles(UserRole.CUSTOMER)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @GetSignedUser() user: UserPayload,
  ) {
    return this.userService.changePassword(changePasswordDto, user.id);
  }

  // Assistant-only endpoint to create students
  @Post('assistant/create-student')
  @Roles(UserRole.ASSISTANT)
  async createStudentByAssistant(
    @Body() createStudentData: CreateStudentDto,
    @GetSignedUser() user: UserPayload,
  ) {
    // Verify that the user is an assistant
    const currentUser = await this.userService.findOneById(user.id);
    if (!currentUser || currentUser.role !== UserRole.ASSISTANT) {
      throw new Error('Only assistants can create students');
    }

    // Create the student entity
    const student = await this.studentService.create({
      firstName: createStudentData.firstName,
      lastName: createStudentData.lastName,
      phoneNumber: createStudentData.phoneNumber,
      parentPhoneNumber: createStudentData.parentPhoneNumber,
    });

    // Find the assistant entity and their teacher
    const assistant = await this.assistantService.findByUserId(currentUser.userId);
    if (assistant && assistant.teacherId) {
      await this.teacherService.addStudentToTeacher(assistant.teacherId, student.id);
    }

    return {
      message: 'Student created successfully by assistant',
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        phoneNumber: student.phoneNumber,
        parentPhoneNumber: student.parentPhoneNumber,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
    };
  }

  // Admin endpoint to create teachers
  @Post('admin/create-teacher')
  @Roles(UserRole.ADMIN)
  async createTeacherByAdmin(
    @Body() createTeacherData: CreateUserDto,
  ) {
    const user = await this.userService.create({
      ...createTeacherData,
      role: UserRole.TEACHER,
    });
    const teacher = await this.teacherService.createWithUser(user);
    return {
      message: 'Teacher created successfully by admin',
      user,
      teacher,
    };
  }

  // Admin endpoint to create assistants
  @Post('admin/create-assistant')
  @Roles(UserRole.ADMIN)
  async createAssistantByAdmin(
    @Body() createAssistantData: CreateUserDto,
  ) {
    const user = await this.userService.create({
      ...createAssistantData,
      role: UserRole.ASSISTANT,
    });
    const assistant = await this.assistantService.createWithUser(user);
    return {
      message: 'Assistant created successfully by admin',
      user,
      assistant,
    };
  }
}
