import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { SubscribeLessonDto } from './dto/subscribe-lesson.dto';
import { UnsubscribeLessonDto } from './dto/unsubscribe-lesson.dto';
import { AddStudentToLessonDto } from './dto/add-student-to-lesson.dto';
import { RemoveStudentFromLessonDto } from './dto/remove-student-from-lesson.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { StartAttendanceDto } from './dto/start-attendance.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { UserRole } from 'src/user/user.role.enum';
import { Roles } from 'src/decorators/role.decorator';
import { GetSignedUser } from 'src/decorators/get.signed.user.decorator';
import { LessonStatus } from './entities/lesson.entity';

@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.TEACHER, UserRole.ASSISTANT)
  create(
    @Body() createLessonDto: CreateLessonDto,
    @GetSignedUser() user: any,
  ) {
    return this.lessonService.create(createLessonDto, user.id, user.role);
  }

  @Get()
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.ASSISTANT)
  findAll() {
    return this.lessonService.findAll();
  }

  @Get('subject/:subject')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.ASSISTANT)
  findBySubject(@Param('subject') subject: string) {
    return this.lessonService.findBySubject(subject);
  }

  @Get('teacher/:teacherId')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.ASSISTANT)
  getLessonsByTeacher(@Param('teacherId') teacherId: string) {
    return this.lessonService.getLessonsByTeacher(teacherId);
  }

  @Get('date/:date')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.ASSISTANT)
  getLessonsByDate(@Param('date') date: string) {
    return this.lessonService.getLessonsByDate(date);
  }

  // @Get('grade/:grade')
  // @UseGuards(AuthGuard)
  // getLessonsByGrade(@Param('grade') grade: string) {
  //   return this.lessonService.getLessonsByGrade(grade);
  // }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.ASSISTANT)
  findOne(@Param('id') id: string) {
    return this.lessonService.findOne(id);
  }

  @Get(':id/students')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.TEACHER, UserRole.ASSISTANT, UserRole.ADMIN)
  getLessonStudents(@Param('id') id: string) {
    return this.lessonService.getLessonStudents(id);
  }

  // New attendance endpoints
  @Post(':id/start-attendance')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.TEACHER, UserRole.ASSISTANT)
  startAttendance(
    @Param('id') lessonId: string,
    @GetSignedUser() user: any,
  ) {
    return this.lessonService.startAttendance({ lessonId }, user.id, user.role);
  }

  @Post('mark-attendance')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.TEACHER, UserRole.ASSISTANT)
  markAttendance(
    @Body() markAttendanceDto: MarkAttendanceDto,
    @GetSignedUser() user: any,
  ) {
    return this.lessonService.markAttendance(markAttendanceDto, user.id, user.role);
  }

  @Get(':id/attendance')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.TEACHER, UserRole.ASSISTANT, UserRole.ADMIN)
  getLessonAttendance(
    @Param('id') id: string,
    @Query('date') date?: string,
  ) {
    if (date) {
      return this.lessonService.getLessonAttendanceForDate(id, date);
    }
    return this.lessonService.getLessonAttendance(id);
  }

  @Get('student/:studentId/attendance-history')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.TEACHER, UserRole.ASSISTANT, UserRole.ADMIN)
  getStudentAttendanceHistory(@Param('studentId') studentId: string) {
    return this.lessonService.getStudentAttendanceHistory(studentId);
  }

  @Post(':id/start-lesson')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.TEACHER, UserRole.ASSISTANT)
  startLesson(
    @Param('id') lessonId: string,
    @GetSignedUser() user: any,
  ) {
    return this.lessonService.startLesson(lessonId, user.id, user.role);
  }

  @Post(':id/complete-lesson')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.TEACHER, UserRole.ASSISTANT)
  completeLesson(
    @Param('id') lessonId: string,
    @GetSignedUser() user: any,
  ) {
    return this.lessonService.completeLesson(lessonId, user.id, user.role);
  }

  // Reopen a completed recurring lesson for the next occurrence
  @Post(':id/reopen-lesson')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.TEACHER, UserRole.ASSISTANT)
  reopenLesson(
    @Param('id') lessonId: string,
    @GetSignedUser() user: any,
  ) {
    return this.lessonService.reopenLesson(lessonId, user.id, user.role);
  }

  // Get upcoming lessons
  @Get('upcoming')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.ASSISTANT)
  getUpcomingLessons() {
    return this.lessonService.getUpcomingLessons();
  }

  // Get completed lessons
  @Get('completed')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.ASSISTANT)
  getCompletedLessons() {
    return this.lessonService.getCompletedLessons();
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.TEACHER, UserRole.ASSISTANT)
  update(
    @Param('id') id: string,
    @Body() updateLessonDto: Partial<CreateLessonDto>,
    @GetSignedUser() user: any,
  ) {
    return this.lessonService.update(id, updateLessonDto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.TEACHER, UserRole.ASSISTANT)
  remove(
    @Param('id') id: string,
    @GetSignedUser() user: any,
  ) {
    return this.lessonService.remove(id, user.id, user.role);
  }

  // Assistant-only endpoints for managing students in lessons
  @Post('add-student')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ASSISTANT, UserRole.TEACHER)
  addStudentToLesson(
    @Body() addStudentDto: AddStudentToLessonDto,
    @GetSignedUser() user: any,
  ) {
    return this.lessonService.addStudentToLesson(
      addStudentDto.lessonId,
      addStudentDto.studentId,
      user.id,
      user.role,
    );
  }

  @Post('remove-student')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ASSISTANT, UserRole.TEACHER)
  removeStudentFromLesson(
    @Body() removeStudentDto: RemoveStudentFromLessonDto,
    @GetSignedUser() user: any,
  ) {
    return this.lessonService.removeStudentFromLesson(
      removeStudentDto.lessonId,
      removeStudentDto.studentId,
      user.id,
      user.role,
    );
  }

  // Students can still unsubscribe themselves
  @Post('unsubscribe')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.STUDENT)
  unsubscribeFromLesson(@Body() unsubscribeDto: UnsubscribeLessonDto) {
    return this.lessonService.unsubscribeFromLesson(unsubscribeDto);
  }

  @Get('student/:studentId/subscriptions')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ASSISTANT, UserRole.ADMIN)
  getStudentSubscriptions(@Param('studentId') studentId: string) {
    return this.lessonService.getStudentSubscriptions(studentId);
  }

  @Get('student/:studentId/lesson/:lessonId/check-subscription')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ASSISTANT, UserRole.ADMIN)
  checkStudentSubscription(
    @Param('studentId') studentId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.lessonService.checkStudentSubscription(studentId, lessonId);
  }

  @Get('teacher/:teacherId/today')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.ASSISTANT)
  getTeacherTodayLessons(
    @Param('teacherId') teacherId: string,
    @Query('subject') subject?: string,
    @Query('status') status?: LessonStatus,
  ) {
    return this.lessonService.getTeacherTodayLessons(teacherId, subject, status);
  }
} 