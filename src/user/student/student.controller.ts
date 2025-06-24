import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './create-student.dto';
// import { CreateStudentByAssistantDto } from '../assistant/create-student-by-assistant.dto';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  @Get()
  findAll() {
    return this.studentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string) {
    return this.studentService.findByEmail(email);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: Partial<CreateStudentDto>) {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }

  @Get(':id/teachers')
  getStudentTeachers(@Param('id') id: string) {
    return this.studentService.getStudentTeachers(id);
  }

  @Get(':id/lessons')
  getStudentLessons(@Param('id') id: string) {
    return this.studentService.getStudentLessons(id);
  }
} 