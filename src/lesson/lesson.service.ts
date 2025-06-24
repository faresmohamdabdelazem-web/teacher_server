import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson, LessonStatus, LessonRecurrenceType } from './entities/lesson.entity';
import { LessonAttendance, AttendanceStatus } from './entities/lesson-attendance.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { SubscribeLessonDto } from './dto/subscribe-lesson.dto';
import { UnsubscribeLessonDto } from './dto/unsubscribe-lesson.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { StartAttendanceDto } from './dto/start-attendance.dto';
import { Teacher } from '../user/teacher/teacher.entity';
import { Student } from '../user/student/student.entity';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/user.role.enum';
import { MoreThan } from 'typeorm';

@Injectable()
export class LessonService {
  constructor(
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(LessonAttendance)
    private attendanceRepository: Repository<LessonAttendance>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private readonly userService: UserService,
  ) {}

  async create(createLessonDto: CreateLessonDto, userId: string, userRole: string): Promise<{ lesson: Lesson, teacher: Teacher } | { lesson: Lesson }> {
    // Validate that only teachers and assistants can create lessons
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ASSISTANT) {
      throw new ForbiddenException('Only teachers and assistants can create lessons');
    }

    // Verify that the teacher/assistant exists and is authorized
    let teacher: Teacher | undefined;
    if (userRole === UserRole.TEACHER) {
      // Check if user exists and has TEACHER role
      const user = await this.userService.findOneById(userId);
      if (!user || user.role !== UserRole.TEACHER) {
        throw new NotFoundException('Teacher not found');
      }
      // Ensure the teacher is creating a lesson for themselves
      if (user.userId !== createLessonDto.teacherId) {
        throw new ForbiddenException('Teachers can only create lessons for themselves');
      }
      teacher = await this.teacherRepository.findOne({ where: { id: user.userId } });
      if (!teacher) {
        throw new NotFoundException('Teacher entity not found');
      }
    } else if (userRole === UserRole.ASSISTANT) {
      // Check if user exists and has ASSISTANT role
      const user = await this.userService.findOneById(userId);
      if (!user || user.role !== UserRole.ASSISTANT) {
        throw new NotFoundException('Assistant not found');
      }
      teacher = await this.teacherRepository.findOne({ where: { id: createLessonDto.teacherId } });
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }
    }

    // Calculate attendance start time (1 hour before lesson start time)
    if (createLessonDto.startTime) {
      const startTime = new Date(createLessonDto.startTime);
      const attendanceStartTime = new Date(startTime.getTime() - 60 * 60 * 1000); // 1 hour before
      createLessonDto['attendanceStartTime'] = attendanceStartTime;
    }

    // Ensure the lesson is assigned to the correct teacher
    const lesson = this.lessonRepository.create({ ...createLessonDto, teacherId: teacher.id });
    const savedLesson = await this.lessonRepository.save(lesson);
    // Reload the lesson with the teacher relation
    const lessonWithTeacher = await this.lessonRepository.findOne({
      where: { id: savedLesson.id },
      relations: ['teacher'],
    });
    return {
      lesson: lessonWithTeacher,
    };
  }

  async findAll(): Promise<{ lessons: Lesson[] }> {
    const lessons = await this.lessonRepository.find({
      relations: ['teacher', 'students'],
    });
    return { lessons };
  }

  async findOne(id: string): Promise<{lesson: Lesson}> {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: ['teacher', 'students'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return { lesson };
  }

  async findBySubject(subject: string): Promise<{ lessons: Lesson[] }> {
    const lessons = await this.lessonRepository.find({
      where: { subject },
      relations: ['teacher', 'students'],
    });
    return { lessons };
  }

  async update(id: string, updateLessonDto: Partial<CreateLessonDto>, userId: string, userRole: string): Promise<Lesson> {
    const lesson = await this.findOne(id);

    // Validate that only teachers and assistants can update lessons
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ASSISTANT) {
      throw new ForbiddenException('Only teachers and assistants can update lessons');
    }

    // Verify authorization
    if (userRole === UserRole.TEACHER) {
      // Check if user exists and has TEACHER role
      const user = await this.userService.findOneById(userId);
      if (!user || user.role !== UserRole.TEACHER || lesson.lesson.teacherId !== user.userId) {
        throw new ForbiddenException('Teachers can only update their own lessons');
      }
    } else if (userRole === UserRole.ASSISTANT) {
      // Assistants can update any lesson (no assignment required)
    }

    Object.assign(lesson, updateLessonDto);
    return await this.lessonRepository.save(lesson.lesson);
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const lesson = await this.findOne(id);

    // Validate that only teachers and assistants can delete lessons
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ASSISTANT) {
      throw new ForbiddenException('Only teachers and assistants can delete lessons');
    }

    // Verify authorization
    if (userRole === UserRole.TEACHER) {
      // Check if user exists and has TEACHER role
      const user = await this.userService.findOneById(userId);
      if (!user || user.role !== UserRole.TEACHER || lesson.lesson.teacherId !== user.userId) {
        throw new ForbiddenException('Teachers can only delete their own lessons');
      }
    } else if (userRole === UserRole.ASSISTANT) {
      // Assistants can delete any lesson (no assignment required)
    }

    await this.lessonRepository.remove(lesson.lesson);
  }

  async getLessonStudents(id: string): Promise<{ students: Student[] }> {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: ['students'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return { students: lesson.students };
  }

  async getLessonsByTeacher(teacherId: string): Promise<{ lessons: Lesson[] }> {
    const teacher = await this.teacherRepository.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const lessons = await this.lessonRepository.find({
      where: { teacherId },
      relations: ['teacher', 'students'],
    });
    return { lessons };
  }

  // Only assistants can add students to lessons
  async addStudentToLesson(lessonId: string, studentId: string, userId: string, userRole: string): Promise<{ lesson: Lesson }> {
    // Validate that only assistants can add students to lessons
    if (userRole !== UserRole.ASSISTANT && userRole !== UserRole.TEACHER) {
      throw new ForbiddenException('Only assistants and teachers can add students to lessons');
    }

    // Check if user exists and has ASSISTANT role
    const user = await this.userService.findOneById(userId);
    if (!user || (user.role !== UserRole.ASSISTANT && user.role !== UserRole.TEACHER)) {
      throw new NotFoundException('Assistant or teacher not found');
    }

    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['students'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Verify student exists
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if student is already added to this lesson
    const isAlreadyAdded = lesson.students.some(student => student.id === studentId);
    if (isAlreadyAdded) {
      throw new ConflictException('Student is already added to this lesson');
    }

    // Add student to lesson
    await this.lessonRepository
      .createQueryBuilder()
      .relation(Lesson, 'students')
      .of(lesson)
      .add(studentId);

    // Return updated lesson with students
    return await this.findOne(lessonId);
  }

  // Only assistants can remove students from lessons
  async removeStudentFromLesson(lessonId: string, studentId: string, userId: string, userRole: string): Promise<{ lesson: Lesson }> {
    // Validate that only assistants can remove students from lessons
    if (userRole !== UserRole.ASSISTANT && userRole !== UserRole.TEACHER) {
      throw new ForbiddenException('Only assistants and teachers can remove students from lessons');
    }

    // Check if user exists and has ASSISTANT role
    const user = await this.userService.findOneById(userId);
    if (!user || (user.role !== UserRole.ASSISTANT && user.role !== UserRole.TEACHER)) {
      throw new NotFoundException('Assistant or teacher not found');
    }

    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['students'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check if student is added to this lesson
    const isAdded = lesson.students.some(student => student.id === studentId);
    if (!isAdded) {
      throw new ConflictException('Student is not added to this lesson');
    }

    // Remove student from lesson
    await this.lessonRepository
      .createQueryBuilder()
      .relation(Lesson, 'students')
      .of(lesson)
      .remove(studentId);

    // Return updated lesson with students
    return await this.findOne(lessonId);
  }

  // Students can no longer subscribe themselves - only assistants can add them
  async subscribeToLesson(subscribeDto: SubscribeLessonDto): Promise<{ lesson: Lesson }> {
    throw new ForbiddenException('Students cannot subscribe themselves. Only assistants can add students to lessons.');
  }

  // Students can still unsubscribe themselves
  async unsubscribeFromLesson(unsubscribeDto: UnsubscribeLessonDto): Promise<{ lesson: Lesson }> {
    const { studentId, lessonId } = unsubscribeDto;

    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['students'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check if student is subscribed to this lesson
    const isSubscribed = lesson.students.some(student => student.id === studentId);
    if (!isSubscribed) {
      throw new ConflictException('Student is not subscribed to this lesson');
    }

    // Remove student from lesson
    await this.lessonRepository
      .createQueryBuilder()
      .relation(Lesson, 'students')
      .of(lesson)
      .remove(studentId);

    // Return updated lesson with students
    return await this.findOne(lessonId);
  }

  async getStudentSubscriptions(studentId: string): Promise<{ subscriptions: Lesson[] }> {
    const lessons = await this.lessonRepository
      .createQueryBuilder('lesson')
      .leftJoinAndSelect('lesson.students', 'student')
      .where('student.id = :studentId', { studentId })
      .getMany();

    return { subscriptions: lessons };
  }

  async checkStudentSubscription(studentId: string, lessonId: string): Promise<boolean> {
    const lesson = await this.lessonRepository
      .createQueryBuilder('lesson')
      .leftJoinAndSelect('lesson.students', 'student')
      .where('lesson.id = :lessonId', { lessonId })
      .andWhere('student.id = :studentId', { studentId })
      .getOne();

    return !!lesson;
  }

  async getLessonsByDate(date: string): Promise<{ lessons: Lesson[] }> {
    const lessons = await this.lessonRepository.find({
      where: { scheduledDate: new Date(date) },
      relations: ['teacher', 'students'],
    });
    return { lessons };
  }

  // async getLessonsByGrade(grade: string): Promise<Lesson[]> {
  //   return await this.lessonRepository.find({
  //     where: { grade },
  //     relations: ['teacher', 'students', 'assistants'],
  //   });
  // }

  // Start attendance for a lesson (only teachers/assistants can do this)
  async startAttendance(startAttendanceDto: StartAttendanceDto, userId: string, userRole: string): Promise<{ lesson: Lesson }> {
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ASSISTANT) {
      throw new ForbiddenException('Only teachers and assistants can start attendance');
    }

    const lesson = await this.findOne(startAttendanceDto.lessonId);
    
    // Check if it's time to start attendance (1 hour before lesson start)
    const now = new Date();
    const attendanceStartTime = lesson.lesson.attendanceStartTime;
    
    if (!attendanceStartTime) {
      throw new BadRequestException('Lesson does not have a scheduled start time');
    }

    if (now < attendanceStartTime) {
      throw new BadRequestException('Attendance can only be started 1 hour before the lesson');
    }

    // Allow completed recurring lessons to be reopened for attendance
    if (lesson.lesson.status !== LessonStatus.SCHEDULED && lesson.lesson.status !== LessonStatus.COMPLETED) {
      throw new BadRequestException('Attendance can only be started for scheduled or completed recurring lessons');
    }

    // If lesson is completed, it means we're reopening it for the next occurrence
    if (lesson.lesson.status === LessonStatus.COMPLETED) {
      if (lesson.lesson.recurrenceType === LessonRecurrenceType.NONE) {
        throw new BadRequestException('Non-recurring completed lessons cannot be reopened');
      }
      
      // Reopen the lesson for the next occurrence
      await this.reopenLesson(startAttendanceDto.lessonId, userId, userRole);
    }

    // Update lesson status to attendance open
    lesson.lesson.status = LessonStatus.ATTENDANCE_OPEN;
    await this.lessonRepository.save(lesson.lesson);

    // Create attendance records for all enrolled students
    const students = await this.getLessonStudents(startAttendanceDto.lessonId);
    for (const student of students.students) {
      const existingAttendance = await this.attendanceRepository.findOne({
        where: { lessonId: startAttendanceDto.lessonId, studentId: student.id }
      });

      if (!existingAttendance) {
        const attendance = this.attendanceRepository.create({
          lessonId: startAttendanceDto.lessonId,
          studentId: student.id,
          status: AttendanceStatus.ABSENT,
          markedBy: userId
        });
        await this.attendanceRepository.save(attendance);
      }
    }

    return { lesson: lesson.lesson };
  }

  // Mark student attendance
  async markAttendance(markAttendanceDto: MarkAttendanceDto, userId: string, userRole: string): Promise<LessonAttendance> {
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ASSISTANT) {
      throw new ForbiddenException('Only teachers and assistants can mark attendance');
    }

    const lesson = await this.findOne(markAttendanceDto.lessonId);
    
    // Check if attendance is open or lesson is in progress
    if (lesson.lesson.status !== LessonStatus.ATTENDANCE_OPEN && lesson.lesson.status !== LessonStatus.IN_PROGRESS) {
      throw new BadRequestException('Attendance can only be marked when lesson is open for attendance or in progress');
    }

    // Verify student is enrolled in the lesson
    const students = await this.getLessonStudents(markAttendanceDto.lessonId);
    const isEnrolled = students.students.some(student => student.id === markAttendanceDto.studentId);
    if (!isEnrolled) {
      throw new BadRequestException('Student is not enrolled in this lesson');
    }

    // Find or create attendance record
    let attendance = await this.attendanceRepository.findOne({
      where: { lessonId: markAttendanceDto.lessonId, studentId: markAttendanceDto.studentId }
    });

    if (!attendance) {
      attendance = this.attendanceRepository.create({
        lessonId: markAttendanceDto.lessonId,
        studentId: markAttendanceDto.studentId,
        status: markAttendanceDto.status,
        attendanceTime: new Date(),
        notes: markAttendanceDto.notes,
        markedBy: userId
      });
    } else {
      attendance.status = markAttendanceDto.status;
      attendance.attendanceTime = new Date();
      attendance.notes = markAttendanceDto.notes;
      attendance.markedBy = userId;
    }

    return await this.attendanceRepository.save(attendance);
  }

  // Get attendance for a lesson
  async getLessonAttendance(lessonId: string): Promise<{ attendance: LessonAttendance[] }> {
    const lesson = await this.findOne(lessonId);
    
    const attendance = await this.attendanceRepository.find({
      where: { lessonId },
      relations: ['student'],
      order: { createdAt: 'ASC' }
    });

    return { attendance };
  }

  // Get student attendance history
  async getStudentAttendanceHistory(studentId: string): Promise<{ attendanceHistory: LessonAttendance[] }> {
    const attendanceHistory = await this.attendanceRepository.find({
      where: { studentId },
      relations: ['lesson'],
      order: { createdAt: 'DESC' }
    });

    return { attendanceHistory };
  }

  // Start the actual lesson (change status to in progress)
  async startLesson(lessonId: string, userId: string, userRole: string): Promise<{lesson: Lesson}> {
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ASSISTANT) {
      throw new ForbiddenException('Only teachers and assistants can start lessons');
    }

    const lesson = await this.findOne(lessonId);
    
    if (lesson.lesson.status !== LessonStatus.ATTENDANCE_OPEN && lesson.lesson.status !== LessonStatus.SCHEDULED) {
      throw new BadRequestException('Lesson cannot be started in its current status');
    }

    lesson.lesson.status = LessonStatus.IN_PROGRESS;
    return { lesson: await this.lessonRepository.save(lesson.lesson) };
  }

  // Complete the lesson
  async completeLesson(lessonId: string, userId: string, userRole: string): Promise<{lesson: Lesson}> {
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ASSISTANT) {
      throw new ForbiddenException('Only teachers and assistants can complete lessons');
    }

    const lesson = await this.findOne(lessonId);
    
    if (lesson.lesson.status !== LessonStatus.IN_PROGRESS) {
      throw new BadRequestException('Only lessons in progress can be completed');
    }

    lesson.lesson.status = LessonStatus.COMPLETED;
    const completedLesson = await this.lessonRepository.save(lesson.lesson);

    // If this is a recurring lesson, schedule the next occurrence
    if (lesson.lesson.recurrenceType !== LessonRecurrenceType.NONE) {
      await this.scheduleNextOccurrence(lesson.lesson);
    }

    return { lesson: completedLesson };
  }

  // Schedule next occurrence for recurring lessons
  private async scheduleNextOccurrence(lesson: Lesson): Promise<void> {
    const nextDate = this.calculateNextOccurrence(lesson);
    
    if (nextDate) {
      // Create a new lesson instance for the next occurrence
      const nextLesson = this.lessonRepository.create({
        title: lesson.title,
        description: lesson.description,
        subject: lesson.subject,
        scheduledDate: nextDate,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        attendanceStartTime: lesson.attendanceStartTime,
        room: lesson.room,
        teacherId: lesson.teacherId,
        recurrenceType: lesson.recurrenceType,
        recurrencePattern: lesson.recurrencePattern,
        status: LessonStatus.SCHEDULED,
        students: lesson.students // Copy enrolled students to next occurrence
      });

      await this.lessonRepository.save(nextLesson);
    }
  }

  // Calculate next occurrence date based on recurrence pattern
  private calculateNextOccurrence(lesson: Lesson): Date | null {
    if (!lesson.scheduledDate || lesson.recurrenceType === LessonRecurrenceType.NONE) {
      return null;
    }

    const currentDate = new Date(lesson.scheduledDate);
    const nextDate = new Date(currentDate);

    switch (lesson.recurrenceType) {
      case LessonRecurrenceType.DAILY:
        nextDate.setDate(currentDate.getDate() + 1);
        break;
      
      case LessonRecurrenceType.WEEKLY:
        if (lesson.recurrencePattern?.dayOfWeek !== undefined) {
          // Find next occurrence of the specified day of week
          const targetDay = lesson.recurrencePattern.dayOfWeek;
          const currentDay = currentDate.getDay();
          const daysToAdd = (targetDay - currentDay + 7) % 7 || 7; // Ensure at least 1 day ahead
          nextDate.setDate(currentDate.getDate() + daysToAdd);
        } else {
          // Default to next week
          nextDate.setDate(currentDate.getDate() + 7);
        }
        break;
      
      case LessonRecurrenceType.MONTHLY:
        nextDate.setMonth(currentDate.getMonth() + 1);
        break;
      
      default:
        return null;
    }

    return nextDate;
  }

  // Reopen a completed lesson for the next occurrence (for recurring lessons)
  async reopenLesson(lessonId: string, userId: string, userRole: string): Promise<{lesson: Lesson}> {
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ASSISTANT) {
      throw new ForbiddenException('Only teachers and assistants can reopen lessons');
    }

    const lesson = await this.findOne(lessonId);
    
    if (lesson.lesson.status !== LessonStatus.COMPLETED) {
      throw new BadRequestException('Only completed lessons can be reopened');
    }

    if (lesson.lesson.recurrenceType === LessonRecurrenceType.NONE) {
      throw new BadRequestException('Non-recurring lessons cannot be reopened');
    }

    // Reset lesson status to scheduled for the next occurrence
    lesson.lesson.status = LessonStatus.SCHEDULED;
    
    // Update scheduled date to next occurrence
    const nextDate = this.calculateNextOccurrence(lesson.lesson);
    if (nextDate) {
      lesson.lesson.scheduledDate = nextDate;
      
      // Recalculate attendance start time
      if (lesson.lesson.startTime) {
        const startTime = new Date(lesson.lesson.startTime);
        const attendanceStartTime = new Date(startTime.getTime() - 60 * 60 * 1000); // 1 hour before
        lesson.lesson.attendanceStartTime = attendanceStartTime;
      }
    }

    return { lesson: await this.lessonRepository.save(lesson.lesson) };
  }

  // Get upcoming lessons (scheduled lessons with future dates)
  async getUpcomingLessons(): Promise<{ lessons: Lesson[] }> {
    const now = new Date();
    const lessons = await this.lessonRepository.find({
      where: {
        scheduledDate: MoreThan(now),
        status: LessonStatus.SCHEDULED
      },
      relations: ['teacher', 'students'],
      order: { scheduledDate: 'ASC' }
    });
    
    return { lessons };
  }

  // Get completed lessons
  async getCompletedLessons(): Promise<{ lessons: Lesson[] }> {
    const lessons = await this.lessonRepository.find({
      where: { status: LessonStatus.COMPLETED },
      relations: ['teacher', 'students'],
      order: { scheduledDate: 'DESC' }
    });
    
    return { lessons };
  }
} 