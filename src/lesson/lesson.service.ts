import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Lesson, LessonStatus, LessonRecurrenceType } from './entities/lesson.entity';
import { LessonAttendance, AttendanceStatus } from './entities/lesson-attendance.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { SubscribeLessonDto } from './dto/subscribe-lesson.dto';
import { UnsubscribeLessonDto } from './dto/unsubscribe-lesson.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { StartAttendanceDto } from './dto/start-attendance.dto';
import { TeacherStatsDto, StatsPeriod, TeacherStatsResponse } from './dto/teacher-stats.dto';
import { Teacher } from '../user/teacher/teacher.entity';
import { Student } from '../user/student/student.entity';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/user.role.enum';
import { MoreThan } from 'typeorm';
import { TeacherStatsService } from './teacher-stats.service';
import { WhatsAppService } from '../notification/whatsapp.service';

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
    public readonly teacherStatsService: TeacherStatsService,
    private readonly whatsAppService: WhatsAppService,
  ) { }

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

    // Ensure scheduledDate is properly set
    if (createLessonDto.scheduledDate) {
      const scheduledDate = new Date(createLessonDto.scheduledDate);

      console.log('Lesson creation - Original input:', {
        originalInput: createLessonDto.scheduledDate,
        parsedDate: scheduledDate.toISOString(),
        localDate: scheduledDate.toString(),
        hours: scheduledDate.getHours(),
        minutes: scheduledDate.getMinutes()
      });

      // Store the scheduledDate as a full datetime (like startTime)
      // Don't convert to local timezone, keep the exact time as provided
      createLessonDto.scheduledDate = scheduledDate.toISOString();

      console.log('Lesson creation - Final scheduledDate:', {
        finalScheduledDate: createLessonDto.scheduledDate
      });
    }

    // Ensure the lesson is assigned to the correct teacher and has proper status
    const lesson = this.lessonRepository.create({
      ...createLessonDto,
      teacherId: teacher.id,
      price: createLessonDto.price,
      status: LessonStatus.SCHEDULED // Explicitly set status to SCHEDULED
    });

    const savedLesson = await this.lessonRepository.save(lesson);

    // Reload the lesson with the teacher relation
    const lessonWithTeacher = await this.lessonRepository.findOne({
      where: { id: savedLesson.id },
      relations: ['teacher'],
    });

    // Update teacher stats
    await this.teacherStatsService.onLessonCreated(lessonWithTeacher);

    return {
      lesson: lessonWithTeacher,
    };
  }

  // Helper method to check and update expired lessons
  private async checkAndUpdateExpiredLessons(lessons: Lesson[]): Promise<void> {
    const now = new Date();
    const lessonsToUpdate: Lesson[] = [];

    for (const lesson of lessons) {
      if (lesson.status !== LessonStatus.COMPLETED && lesson.status !== LessonStatus.CANCELLED && lesson.status !== LessonStatus.EXPIRED) {
        // Determine the lesson end time
        let lessonEndTime: Date;

        if (lesson.endTime) {
          // Use the lesson's actual end time
          lessonEndTime = new Date(lesson.endTime);
        } else if (lesson.startTime) {
          // If only start time is available, assume 1 hour duration
          lessonEndTime = new Date(lesson.startTime.getTime() + (60 * 60 * 1000));
        } else if (lesson.scheduledDate) {
          // If no time is specified, use scheduled date + 2 hours as fallback
          const lessonDate = new Date(lesson.scheduledDate);
          lessonEndTime = new Date(lessonDate.getTime() + (2 * 60 * 60 * 1000));
        } else {
          // Skip lessons without any time information
          continue;
        }

        // Calculate expiration time (2 hours after lesson end time)
        const expirationTime = new Date(lessonEndTime.getTime() + (2 * 60 * 60 * 1000));

        // Mark as expired if current time is past the expiration time
        // and it's not a recurring lesson that might be reopened
        if (now > expirationTime && lesson.recurrenceType === LessonRecurrenceType.NONE) {
          lesson.status = LessonStatus.EXPIRED;
          lessonsToUpdate.push(lesson);
        }
      }
    }

    // Save updated lessons if any
    if (lessonsToUpdate.length > 0) {
      await this.lessonRepository.save(lessonsToUpdate);
    }
  }

  async findAll(): Promise<{ lessons: Lesson[] }> {
    const lessons = await this.lessonRepository.find({
      relations: ['teacher', 'students'],
    });

    // Check for expired lessons and update their status
    await this.checkAndUpdateExpiredLessons(lessons);

    // Add attendance history to each lesson (filtered by current occurrence date)
    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        // Get the start and end of the lesson's scheduled date
        const lessonDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
        const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(startOfDay, endOfDay)
          },
          relations: ['student'],
          order: { createdAt: 'ASC' }
        });

        return {
          ...lesson,
          attendanceHistory: attendance
        };
      })
    );

    return { lessons: lessonsWithAttendance };
  }

  async findOne(id: string): Promise<{ lesson: Lesson }> {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: ['teacher', 'students'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check for expired lesson and update its status
    await this.checkAndUpdateExpiredLessons([lesson]);

    // Get attendance history for current occurrence
    const lessonDate = new Date(lesson.scheduledDate);
    const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
    const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);

    const attendance = await this.attendanceRepository.find({
      where: {
        lessonId: lesson.id,
        createdAt: Between(startOfDay, endOfDay)
      },
      relations: ['student'],
      order: { createdAt: 'ASC' }
    });

    return {
      lesson: {
        ...lesson,
        attendanceHistory: attendance
      } as any
    };
  }

  async findBySubject(subject: string): Promise<{ lessons: Lesson[] }> {
    const lessons = await this.lessonRepository.find({
      where: { subject },
      relations: ['teacher', 'students'],
    });

    // Check for expired lessons and update their status
    await this.checkAndUpdateExpiredLessons(lessons);

    // Add attendance history to each lesson (filtered by current occurrence date)
    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        // Get the start and end of the lesson's scheduled date
        const lessonDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
        const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(startOfDay, endOfDay)
          },
          relations: ['student'],
          order: { createdAt: 'ASC' }
        });

        return {
          ...lesson,
          attendanceHistory: attendance
        };
      })
    );

    return { lessons: lessonsWithAttendance };
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

    // Check for expired lessons and update their status
    await this.checkAndUpdateExpiredLessons(lessons);

    // Add attendance history to each lesson (filtered by current occurrence date)
    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        // Get the start and end of the lesson's scheduled date
        const lessonDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
        const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(startOfDay, endOfDay)
          },
          relations: ['student'],
          order: { createdAt: 'ASC' }
        });

        return {
          ...lesson,
          attendanceHistory: attendance
        };
      })
    );

    return { lessons: lessonsWithAttendance };
  }

  // Only assistants can add students to lessons
  async addStudentToLesson(lessonId: string, studentId: string, userId: string, userRole: string): Promise<{ lessonId: string, studentId: string, studentPhoneNumber: string | null, firstName: string, lastName: string }> {
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

    // Check if student grade matches lesson grade
    if (lesson.grade && student.grade && lesson.grade !== student.grade) {
      throw new BadRequestException(`Student grade (${student.grade}) does not match lesson grade (${lesson.grade})`);
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

    // Update teacher stats
    await this.teacherStatsService.onStudentAddedToLesson(lessonId);

    // Return lessonId, studentId, studentPhoneNumber, firstName, lastName
    return {
      lessonId: lessonId,
      studentId: studentId,
      studentPhoneNumber: student.phoneNumber || null,
      firstName: student.firstName,
      lastName: student.lastName,
    };
  }

  // Transfer student from one lesson to another (replace old lesson with new lesson)
  async transferStudentToLesson(studentId: string, toLessonId: string, userId: string, userRole: string): Promise<{ message: string }> {
    // Validate that only assistants and teachers can transfer students
    if (userRole !== UserRole.ASSISTANT && userRole !== UserRole.TEACHER) {
      throw new ForbiddenException('Only assistants and teachers can transfer students between lessons');
    }

    // Check if user exists and has proper role
    const user = await this.userService.findOneById(userId);
    if (!user || (user.role !== UserRole.ASSISTANT && user.role !== UserRole.TEACHER)) {
      throw new NotFoundException('Assistant or teacher not found');
    }

    // Verify student exists
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get the destination lesson (lesson to add student to)
    const toLesson = await this.lessonRepository.findOne({
      where: { id: toLessonId },
      relations: ['students'],
    });
    if (!toLesson) {
      throw new NotFoundException('Destination lesson not found');
    }

    // Check if student is already in the destination lesson
    const isInDestinationLesson = toLesson.students.some(s => s.id === studentId);
    if (isInDestinationLesson) {
      throw new BadRequestException('Student is already enrolled in the destination lesson');
    }

    // Check if student grade matches destination lesson grade
    if (toLesson.grade && student.grade && toLesson.grade !== student.grade) {
      throw new BadRequestException(`Student grade (${student.grade}) does not match destination lesson grade (${toLesson.grade})`);
    }

    // Find the lesson where the student is currently registered
    const currentLesson = await this.lessonRepository
      .createQueryBuilder('lesson')
      .leftJoinAndSelect('lesson.students', 'student')
      .where('student.id = :studentId', { studentId })
      .getOne();

    if (!currentLesson) {
      throw new BadRequestException('Student is not enrolled in any lesson');
    }

    // Check if source and destination lessons are the same
    if (currentLesson.id === toLessonId) {
      throw new BadRequestException('Student is already enrolled in the destination lesson');
    }

    // Remove student from current lesson
    await this.lessonRepository
      .createQueryBuilder()
      .relation(Lesson, 'students')
      .of(currentLesson)
      .remove(studentId);

    // Add student to destination lesson
    await this.lessonRepository
      .createQueryBuilder()
      .relation(Lesson, 'students')
      .of(toLesson)
      .add(studentId);

    // Update teacher stats for both lessons
    await this.teacherStatsService.onStudentRemovedFromLesson(currentLesson.id);
    await this.teacherStatsService.onStudentAddedToLesson(toLessonId);

    return { message: 'Student transferred successfully' };
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

    // Update teacher stats
    await this.teacherStatsService.onStudentRemovedFromLesson(lessonId);

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

    // Add attendance history to each lesson (filtered by current occurrence date)
    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        // Get the start and end of the lesson's scheduled date
        const lessonDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
        const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(startOfDay, endOfDay)
          },
          relations: ['student'],
          order: { createdAt: 'ASC' }
        });

        return {
          ...lesson,
          attendanceHistory: attendance
        };
      })
    );

    return { lessons: lessonsWithAttendance };
  }

  async getTodayLessons(
    date?: string,
    subject?: string,
    status?: LessonStatus,
    grade?: string
  ): Promise<{ lessons: Lesson[] }> {
    let startOfDay: Date;
    let endOfDay: Date;

    if (date) {
      // If date is provided, use that specific date
      const targetDate = new Date(date);
      startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    } else {
      // If no date provided, use today's date
      const today = new Date();
      startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    }

    console.log('Today lessons - Date range:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      dateProvided: !!date,
      providedDate: date,
      subject,
      status,
      grade
    });

    // Build the where clause with filters
    const whereClause: any = {
      scheduledDate: Between(startOfDay, endOfDay)
    };

    // Add subject filter if provided
    if (subject) {
      whereClause.subject = subject;
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    // Add grade filter if provided
    if (grade) {
      whereClause.grade = grade;
    }

    const lessons = await this.lessonRepository.find({
      where: whereClause,
      relations: ['teacher', 'students'],
      order: { startTime: 'ASC' },
    });

    console.log('Today lessons - Found lessons:', lessons.length);

    // Check for expired lessons and update their status
    await this.checkAndUpdateExpiredLessons(lessons);

    // Add attendance history to each lesson (filtered by current occurrence date)
    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        // Get the start and end of the lesson's scheduled date
        const lessonDate = new Date(lesson.scheduledDate);
        const lessonStartOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
        const lessonEndOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(lessonStartOfDay, lessonEndOfDay)
          },
          relations: ['student'],
          order: { createdAt: 'ASC' }
        });

        return {
          ...lesson,
          attendanceHistory: attendance
        };
      })
    );

    return { lessons: lessonsWithAttendance };
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

    // Check if it's before the scheduled date - compare only the date part
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const scheduledDate = new Date(lesson.lesson.scheduledDate);
    const lessonDate = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());

    console.log('Today (date only):', today);
    console.log('Lesson date (date only):', lessonDate);

    if (today < lessonDate) {
      throw new BadRequestException('Attendance cannot be started before the scheduled date');
    }

    // Check if lesson is in the past (more than 1 day old)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lessonDate < yesterday) {
      throw new BadRequestException('Attendance cannot be started for lessons that are more than 1 day in the past');
    }

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

    // Don't create attendance records here - let markAttendance create them when needed
    // This prevents issues with recurring lessons where the same lessonId is reused

    return { lesson: lesson.lesson };
  }

  // Mark student attendance
  async markAttendance(markAttendanceDto: MarkAttendanceDto, userId: string, userRole: string): Promise<{ attendance: LessonAttendance }> {
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ASSISTANT) {
      throw new ForbiddenException('Only teachers and assistants can mark attendance');
    }

    const lesson = await this.findOne(markAttendanceDto.lessonId);

    // Check if attendance is open or lesson is in progress
    if (lesson.lesson.status !== LessonStatus.ATTENDANCE_OPEN && lesson.lesson.status !== LessonStatus.IN_PROGRESS) {
      throw new BadRequestException('Attendance can only be marked when lesson is open for attendance or in progress');
    }
    // Check if lesson is in the past (more than 1 day old)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const scheduledDate = new Date(lesson.lesson.scheduledDate);
    const lessonDate = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lessonDate < yesterday) {
      throw new BadRequestException('Attendance cannot be marked for lessons that are more than 1 day in the past');
    }
    const students = await this.getLessonStudents(markAttendanceDto.lessonId);
    const isEnrolled = students.students.some(student => student.id === markAttendanceDto.studentId);
    if (!isEnrolled) {
      throw new BadRequestException('Student is not enrolled in this lesson');
    }


    // Check if an attendance record already exists for this student and lesson (for the same occurrence)
    const startOfDay = new Date(lesson.lesson.scheduledDate.getFullYear(), lesson.lesson.scheduledDate.getMonth(), lesson.lesson.scheduledDate.getDate());
    const endOfDay = new Date(lesson.lesson.scheduledDate.getFullYear(), lesson.lesson.scheduledDate.getMonth(), lesson.lesson.scheduledDate.getDate(), 23, 59, 59, 999);
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        lessonId: markAttendanceDto.lessonId,
        studentId: markAttendanceDto.studentId,
        attendanceTime: Between(startOfDay, endOfDay)
      }
    });
    if (existingAttendance) {
      throw new ConflictException('Attendance for this student in this lesson already exists for this occurrence');
    }

    // Always create a new attendance record for this occurrence
    // This ensures each occurrence has its own attendance record
    const currentTime = new Date();

    const attendance = this.attendanceRepository.create({
      lessonId: markAttendanceDto.lessonId,
      studentId: markAttendanceDto.studentId,
      status: markAttendanceDto.status,
      attendanceTime: currentTime,
      notes: markAttendanceDto.notes,
      markedBy: userId
    });

    // Save the new attendance record
    const savedAttendance = await this.attendanceRepository.save(attendance);

    // Update teacher stats
    await this.teacherStatsService.onAttendanceMarked(markAttendanceDto.lessonId);

    // Send WhatsApp message to parent if present
    if (markAttendanceDto.status === AttendanceStatus.PRESENT) {
      // Fetch student and lesson details
      const student = await this.studentRepository.findOne({ where: { id: markAttendanceDto.studentId } });
      const lessonDetails = await this.lessonRepository.findOne({ where: { id: markAttendanceDto.lessonId } });
      if (student && student.parentPhoneNumber && lessonDetails) {
        const studentName = `${student.firstName} ${student.lastName}`;
        await this.whatsAppService.sendPresentNotification(
          student.parentPhoneNumber,
          studentName,
          lessonDetails.title,
          lessonDetails.scheduledDate,
          lessonDetails.subject
        );
      }
    }

    return { attendance: savedAttendance };
  }

  // Get attendance for a lesson (filtered by current occurrence date)
  async getLessonAttendance(lessonId: string, date?: string): Promise<{ attendance: LessonAttendance[] }> {
    const lesson = await this.findOne(lessonId);

    if (date) {
      // If date is provided, filter by that specific date
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

      const attendance = await this.attendanceRepository.find({
        where: {
          lessonId,
          createdAt: Between(startOfDay, endOfDay)
        },
        relations: ['student', 'lesson'],
        order: { lesson: { scheduledDate: 'ASC' } }
      });

      return { attendance };
    } else {
      // If no date provided, return current attendance only (not filtered by date)
      const attendance = await this.attendanceRepository.find({
        where: { lessonId },
        relations: ['student', 'lesson'],
        order: { lesson: { scheduledDate: 'ASC' } }
      });

      return { attendance };
    }
  }

  // Get lesson attendance history for a specific date range
  async getLessonAttendanceHistory(lessonId: string, startDate: string, endDate: string): Promise<{ attendance: LessonAttendance[] }> {
    const lesson = await this.findOne(lessonId);

    const startOfRange = new Date(startDate);
    const endOfRange = new Date(endDate);
    endOfRange.setHours(23, 59, 59, 999);

    const attendance = await this.attendanceRepository.find({
      where: {
        lessonId,
        createdAt: Between(startOfRange, endOfRange)
      },
      relations: ['student'],
      order: { createdAt: 'ASC' }
    });

    return { attendance };
  }

  // Get lesson attendance for a specific date
  async getLessonAttendanceForDate(lessonId: string, date: string): Promise<{ attendance: LessonAttendance[] }> {
    const lesson = await this.findOne(lessonId);

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const attendance = await this.attendanceRepository.find({
      where: {
        lessonId,
        createdAt: Between(startOfDay, endOfDay)
      },
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
  async startLesson(lessonId: string, userId: string, userRole: string): Promise<{ lesson: Lesson }> {
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

  async completeLesson(lessonId: string): Promise<any> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['teacher', 'students']
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.status !== LessonStatus.IN_PROGRESS) {
      throw new BadRequestException('Lesson must be in progress to complete');
    }

    // Store the current lesson date before updating it
    const currentLessonDate = new Date(lesson.scheduledDate);
    const oldStatus = lesson.status;

    // Update lesson status to completed
    lesson.status = LessonStatus.COMPLETED;
    const completedLesson = await this.lessonRepository.save(lesson);

    // Mark students as absent if they don't have attendance records
    await this.markAbsentStudentsWithoutAttendance(lessonId);

    // Update teacher stats with earnings calculation based on student attendance
    await this.teacherStatsService.onLessonCompleted(completedLesson);

    // Send WhatsApp notifications to parents of absent students
    await this.sendAbsenceNotifications(lessonId, currentLessonDate);

    // If this is a recurring lesson, update the same lesson for next occurrence
    if (lesson.recurrenceType !== LessonRecurrenceType.NONE) {
      const nextDate = this.calculateNextOccurrence(lesson);

      if (nextDate) {
        // Update the same lesson entity for next occurrence
        completedLesson.status = LessonStatus.SCHEDULED;
        completedLesson.scheduledDate = nextDate;

        // Update startTime to be the same as the new scheduled date
        if (completedLesson.startTime) {
          const originalStartTime = new Date(completedLesson.startTime);
          const newStartTime = new Date(nextDate);
          newStartTime.setHours(originalStartTime.getHours(), originalStartTime.getMinutes(), originalStartTime.getSeconds(), originalStartTime.getMilliseconds());
          completedLesson.startTime = newStartTime;
        }

        // Update endTime to have the new date but keep the same time part
        if (completedLesson.endTime) {
          const originalEndTime = new Date(completedLesson.endTime);
          const newEndTime = new Date(nextDate);
          newEndTime.setHours(originalEndTime.getHours(), originalEndTime.getMinutes(), originalEndTime.getSeconds(), originalEndTime.getMilliseconds());
          completedLesson.endTime = newEndTime;
        }

        // Recalculate attendance start time for next occurrence
        if (completedLesson.startTime) {
          const startTime = new Date(completedLesson.startTime);
          const attendanceStartTime = new Date(startTime.getTime() - 60 * 60 * 1000); // 1 hour before
          completedLesson.attendanceStartTime = attendanceStartTime;
        }

        await this.lessonRepository.save(completedLesson);
      }
    }

    return {
      lesson: {
        ...completedLesson,
        status: LessonStatus.COMPLETED
      }
    };
  }

  // Send WhatsApp notifications to parents of absent students
  private async sendAbsenceNotifications(lessonId: string, lessonDate: Date): Promise<void> {
    try {
      // Get lesson details first
      const lesson = await this.lessonRepository.findOne({
        where: { id: lessonId }
      });

      if (!lesson) {
        return;
      }

      // Use the passed lessonDate parameter instead of lesson.scheduledDate
      // because lesson.scheduledDate gets updated to next occurrence after completion
      const lessonScheduledDate = new Date(lessonDate);
      const startOfDay = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), lessonScheduledDate.getDate());
      const endOfDay = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), lessonScheduledDate.getDate(), 23, 59, 59, 999);

      const attendance = await this.attendanceRepository.find({
        where: {
          lessonId,
          attendanceTime: Between(startOfDay, endOfDay) // Only current occurrence
        },
        relations: ['student', 'lesson']
      });

      // Filter for absent students in the current occurrence only
      const absentStudents = attendance.filter(record =>
        record.status === AttendanceStatus.ABSENT &&
        record.student?.parentPhoneNumber
      );

      console.log('Absence notifications - Current occurrence check:', {
        lessonId,
        lessonDate: lessonScheduledDate.toISOString(),
        totalAttendanceRecords: attendance.length,
        absentStudentsCount: absentStudents.length,
        absentStudents: absentStudents.map(record => ({
          studentId: record.studentId,
          studentName: `${record.student?.firstName} ${record.student?.lastName}`,
          parentPhone: record.student?.parentPhoneNumber,
          attendanceTime: record.attendanceTime
        }))
      });

      // Send notifications to parents of absent students for current occurrence only
      const notificationPromises = absentStudents.map(async (attendanceRecord) => {
        const student = attendanceRecord.student;
        if (student && student.parentPhoneNumber) {
          const studentName = `${student.firstName} ${student.lastName}`;

          return this.whatsAppService.sendAbsenceNotification(
            student.parentPhoneNumber,
            studentName,
            lesson.title,
            lessonDate,
            lesson.subject
          );
        }
      });

      // Wait for all notifications to be sent
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error sending absence notifications:', error);
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
  async reopenLesson(lessonId: string, userId: string, userRole: string): Promise<{ lesson: Lesson }> {
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

      // Update startTime to be the same as the new scheduled date
      if (lesson.lesson.startTime) {
        const originalStartTime = new Date(lesson.lesson.startTime);
        const newStartTime = new Date(nextDate);
        newStartTime.setHours(originalStartTime.getHours(), originalStartTime.getMinutes(), originalStartTime.getSeconds(), originalStartTime.getMilliseconds());
        lesson.lesson.startTime = newStartTime;
      }

      // Update endTime to have the new date but keep the same time part
      if (lesson.lesson.endTime) {
        const originalEndTime = new Date(lesson.lesson.endTime);
        const newEndTime = new Date(nextDate);
        newEndTime.setHours(originalEndTime.getHours(), originalEndTime.getMinutes(), originalEndTime.getSeconds(), originalEndTime.getMilliseconds());
        lesson.lesson.endTime = newEndTime;
      }

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

    // Check for expired lessons and update their status
    await this.checkAndUpdateExpiredLessons(lessons);

    // Add attendance history to each lesson (filtered by current occurrence date)
    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        // Get the start and end of the lesson's scheduled date
        const lessonDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
        const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(startOfDay, endOfDay)
          },
          relations: ['student'],
          order: { createdAt: 'ASC' }
        });

        return {
          ...lesson,
          attendanceHistory: attendance
        };
      })
    );

    return { lessons: lessonsWithAttendance };
  }

  // Get completed lessons
  async getCompletedLessons(): Promise<{ lessons: Lesson[] }> {
    const lessons = await this.lessonRepository.find({
      where: { status: LessonStatus.COMPLETED },
      relations: ['teacher', 'students'],
      order: { scheduledDate: 'DESC' }
    });

    // Check for expired lessons and update their status
    await this.checkAndUpdateExpiredLessons(lessons);

    // Add attendance history to each lesson (filtered by current occurrence date)
    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        // Get the start and end of the lesson's scheduled date
        const lessonDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
        const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(startOfDay, endOfDay)
          },
          relations: ['student'],
          order: { createdAt: 'ASC' }
        });

        return {
          ...lesson,
          attendanceHistory: attendance
        };
      })
    );

    return { lessons: lessonsWithAttendance };
  }

  // Get teacher's today lessons
  async getTeacherTodayLessons(
    teacherId: string,
    subject?: string,
    status?: LessonStatus,
    date?: string
  ): Promise<{ lessons: Lesson[] }> {
    // Determine the date range based on the date parameter
    let startOfDay: Date;
    let endOfDay: Date;

    if (date) {
      // If date is provided, use that specific date
      const targetDate = new Date(date);
      console.log('Teacher today lessons - Date parsing:', {
        originalDate: date,
        parsedDate: targetDate.toISOString(),
        parsedDateString: targetDate.toString(),
        year: targetDate.getFullYear(),
        month: targetDate.getMonth(),
        day: targetDate.getDate()
      });
      startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    } else {
      // If no date provided, use today's date
      const today = new Date();
      startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    }

if(!teacherId) throw new NotFoundException("Teacher Id Not Sent")

    // Build where clause dynamically
    const whereClause: any = {
      teacherId: teacherId,
      scheduledDate: Between(startOfDay, endOfDay),
    };
    if (subject) {
      whereClause.subject = subject;
    }
    if (status) {
      whereClause.status = status;
    }

  

    const lessons = await this.lessonRepository.find({
      where: whereClause,
      relations: ['teacher', 'students'],
      order: { startTime: 'ASC' },
    });

    console.log('Teacher today lessons - Found lessons:', lessons.length);
    lessons.forEach((lesson, index) => {
      const lessonDate = lesson.scheduledDate ? new Date(lesson.scheduledDate) : null;
      console.log(`Teacher today lessons - Lesson ${index + 1}:`, {
        id: lesson.id,
        title: lesson.title,
        scheduledDate: lesson.scheduledDate,
        scheduledDateType: typeof lesson.scheduledDate,
        scheduledDateISO: lessonDate?.toISOString(),
        dateKey: lessonDate ? lessonDate.toISOString().split('T')[0] : null,
        hours: lessonDate ? lessonDate.getHours() : null
      });
    });

    // Check for expired lessons and update their status
    await this.checkAndUpdateExpiredLessons(lessons);

    // Add attendance history to each lesson (filtered by current occurrence date)
    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        // Get the start and end of the lesson's scheduled date
        const lessonDate = new Date(lesson.scheduledDate);
        const lessonStartOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
        const lessonEndOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(lessonStartOfDay, lessonEndOfDay)
          },
          relations: ['student'],
          order: { createdAt: 'ASC' }
        });

        return {
          ...lesson,
          attendanceHistory: attendance
        };
      })
    );

    return { lessons: lessonsWithAttendance };
  }

  async calculateTeacherStats(teacherId: string, period: StatsPeriod, startDate?: string, endDate?: string): Promise<TeacherStatsResponse> {

 if(!teacherId) throw new  NotFoundException("No TeacherId Found")

    const teacher = await this.teacherRepository.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Use the TeacherStatsService to get pre-calculated stats
    const statsData = await this.teacherStatsService.getTeacherStats(teacherId, period, startDate, endDate);

    // Separate data points by type
    const lessons: Array<{ date: string; count: number }> = [];
    const students: Array<{ date: string; count: number }> = [];
    const attendance: Array<{ date: string; count: number }> = [];
    const earnings: Array<{ date: string; amount: number }> = [];

    // Process each stat and separate by type
    statsData.stats.forEach(stat => {
      if (stat.totalLessons > 0) {
        lessons.push({
          date: stat.date,
          count: stat.totalLessons
        });
      }

      if (stat.totalStudents > 0) {
        students.push({
          date: stat.date,
          count: stat.totalStudents
        });
      }

      if (stat.totalAttendance > 0) {
        attendance.push({
          date: stat.date,
          count: stat.totalAttendance
        });
      }

      if (stat.totalEarnings > 0) {
        earnings.push({
          date: stat.date,
          amount: stat.totalEarnings
        });
      }
    });

    // Calculate totals from the separated data points
    const totalLessons = lessons.reduce((sum, point) => sum + point.count, 0);
    const totalStudents = students.reduce((sum, point) => sum + point.count, 0);
    const totalAttendance = attendance.reduce((sum, point) => sum + point.count, 0);
    const totalEarnings = earnings.reduce((sum, point) => sum + point.amount, 0);

    // Calculate completion rate from the stored stats
    const totalCompletedLessons = statsData.stats.reduce((sum, stat) => sum + stat.completedLessons, 0);
    const completionRate = totalLessons > 0 ? (totalCompletedLessons / totalLessons) * 100 : 0;

    // Calculate averages
    const averageEarningsPerLesson = totalLessons > 0 ? totalEarnings / totalLessons : 0;
    const averageStudentsPerLesson = totalLessons > 0 ? totalStudents / totalLessons : 0;

    return {
      teacherId,
      period,
      totalLessons,
      totalStudents,
      totalAttendance,
      totalEarnings,
      averageEarningsPerLesson: Math.round(averageEarningsPerLesson * 100) / 100,
      averageStudentsPerLesson: Math.round(averageStudentsPerLesson * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      lessons,
      students,
      attendance,
      earnings
    };
  }

  async getAllTeacherLessons(teacherId: string): Promise<{ lessons: Lesson[] }> {
    const teacher = await this.teacherRepository.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const lessons = await this.lessonRepository.find({
      where: { teacherId },
      relations: ['teacher', 'students'],
      order: { scheduledDate: 'DESC' }
    });

    // Check for expired lessons and update their status
    await this.checkAndUpdateExpiredLessons(lessons);

    // Add attendance history to each lesson
    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        const attendance = await this.attendanceRepository.find({
          where: { lessonId: lesson.id },
          relations: ['student'],
          order: { createdAt: 'ASC' }
        });

        return {
          ...lesson,
          attendanceHistory: attendance
        };
      })
    );

    return { lessons: lessonsWithAttendance };
  }

  async initializeTeacherStats(teacherId: string): Promise<void> {
    await this.teacherStatsService.initializeStatsForTeacher(teacherId);
  }

  async recalculateTeacherStats(teacherId: string): Promise<void> {
    await this.teacherStatsService.recalculateTeacherStats(teacherId);
  }

  async resetTeacherStats(teacherId: string): Promise<void> {
    await this.teacherStatsService.clearTeacherStats(teacherId);
    await this.teacherStatsService.recalculateTeacherStats(teacherId);
  }

  async debugTeacherLessons(teacherId: string): Promise<any> {
    const lessons = await this.lessonRepository.find({
      where: { teacherId },
      relations: ['students']
    });

    return {
      teacherId,
      totalLessons: lessons.length,
      lessons: lessons.map(lesson => {
        const lessonDate = lesson.scheduledDate ? new Date(lesson.scheduledDate) : null;
        return {
          id: lesson.id,
          title: lesson.title,
          price: lesson.price,
          priceType: typeof lesson.price,
          priceString: lesson.price?.toString(),
          scheduledDate: lesson.scheduledDate,
          scheduledDateType: typeof lesson.scheduledDate,
          scheduledDateISO: lessonDate?.toISOString(),
          scheduledDateString: lessonDate?.toString(),
          dateKey: lessonDate ? lessonDate.toISOString().split('T')[0] : null,
          status: lesson.status,
          studentsCount: lesson.students.length,
          students: lesson.students.map(student => ({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName
          }))
        };
      })
    };
  }

  async getTeacherStatsByDate(teacherId: string, startDate: string, endDate: string): Promise<any> {
    const teacher = await this.teacherRepository.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const lessons = await this.lessonRepository.find({
      where: {
        teacherId,
        scheduledDate: Between(new Date(startDate), new Date(endDate))
      },
      relations: ['students']
    });

    const lessonIds = lessons.map(l => l.id);
    const attendanceData = await this.attendanceRepository.find({
      where: { lessonId: In(lessonIds) }
    });

    // Count unique students across all lessons
    const uniqueStudentIds = new Set();
    lessons.forEach(lesson => {
      lesson.students?.forEach(student => {
        uniqueStudentIds.add(student.id);
      });
    });

    return {
      teacherId,
      startDate,
      endDate,
      totalLessons: lessons.length,
      totalStudents: uniqueStudentIds.size,
      totalAttendance: attendanceData.length,
      totalEarnings: lessons.reduce((sum, lesson) => sum + (parseFloat(lesson.price?.toString() || '0')), 0),
      lessons: lessons.map(lesson => {
        const lessonDate = lesson.scheduledDate ? new Date(lesson.scheduledDate) : null;
        return {
          id: lesson.id,
          title: lesson.title,
          scheduledDate: lesson.scheduledDate,
          dateKey: lessonDate ? lessonDate.toISOString().split('T')[0] : null,
          price: lesson.price,
          status: lesson.status,
          studentsCount: lesson.students.length
        };
      })
    };
  }

  async getAllLessonsForTeacher(teacherId: string): Promise<any> {
    const lessons = await this.lessonRepository.find({
      where: { teacherId },
      relations: ['students'],
      order: { scheduledDate: 'DESC' }
    });

    return {
      teacherId,
      totalLessons: lessons.length,
      lessons: lessons.map(lesson => {
        const lessonDate = lesson.scheduledDate ? new Date(lesson.scheduledDate) : null;
        return {
          id: lesson.id,
          title: lesson.title,
          scheduledDate: lesson.scheduledDate,
          scheduledDateType: typeof lesson.scheduledDate,
          scheduledDateISO: lessonDate?.toISOString(),
          dateKey: lessonDate ? lessonDate.toISOString().split('T')[0] : null,
          hours: lessonDate ? lessonDate.getHours() : null,
          minutes: lessonDate ? lessonDate.getMinutes() : null,
          status: lesson.status,
          studentsCount: lesson.students.length
        };
      })
    };
  }

  private async markAbsentStudentsWithoutAttendance(lessonId: string): Promise<void> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['students']
    });

    if (!lesson) {
      return;
    }

    // Get lesson's scheduled date to identify current occurrence
    const lessonScheduledDate = new Date(lesson.scheduledDate);
    const startOfDay = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), lessonScheduledDate.getDate());
    const endOfDay = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), lessonScheduledDate.getDate(), 23, 59, 59, 999);

    // Get attendance records for the current occurrence only
    const existingAttendance = await this.attendanceRepository.find({
      where: {
        lessonId,
        attendanceTime: Between(startOfDay, endOfDay) // Only current occurrence
      }
    });

    console.log('Marking absent students - Current occurrence check:', {
      lessonId,
      lessonDate: lessonScheduledDate.toISOString(),
      totalStudents: lesson.students.length,
      existingAttendanceCount: existingAttendance.length,
      existingAttendance: existingAttendance.map(record => ({
        studentId: record.studentId,
        status: record.status,
        createdAt: record.createdAt
      }))
    });

    // Find students who don't have attendance records for the current occurrence
    const studentsWithoutAttendance = lesson.students.filter(student =>
      !existingAttendance.some(attendance => attendance.studentId === student.id)
    );

    console.log('Students without attendance for current occurrence:', {
      count: studentsWithoutAttendance.length,
      students: studentsWithoutAttendance.map(student => ({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`
      }))
    });

    // Mark these students as absent for the current occurrence
    const now = new Date();
    for (const student of studentsWithoutAttendance) {
      const attendance = this.attendanceRepository.create({
        lessonId,
        studentId: student.id,
        status: AttendanceStatus.ABSENT,
        createdAt: now,
        attendanceTime: lessonScheduledDate,
        markedBy: 'system'
      });
      await this.attendanceRepository.save(attendance);

      console.log('Marked student as absent:', {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        lessonId,
        lessonDate: lessonScheduledDate.toISOString()
      });
    }
  }

  // Debug method to check lesson data
  async debugLessonData(lessonId: string): Promise<any> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['teacher', 'students']
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Get all attendance records for this lesson
    const allAttendance = await this.attendanceRepository.find({
      where: { lessonId },
      relations: ['student']
    });

    // Get lesson's scheduled date
    const lessonScheduledDate = new Date(lesson.scheduledDate);
    const startOfDay = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), lessonScheduledDate.getDate());
    const endOfDay = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), lessonScheduledDate.getDate(), 23, 59, 59, 999);

    // Filter attendance for current occurrence
    const currentOccurrenceAttendance = allAttendance.filter(record => {
      const attendanceTime = new Date(record.attendanceTime);
      return attendanceTime >= startOfDay && attendanceTime <= endOfDay;
    });

    return {
      lessonId: lesson.id,
      title: lesson.title,
      pricingType: lesson.pricingType,
      price: lesson.price,
      priceType: typeof lesson.price,
      priceString: lesson.price?.toString(),
      scheduledDate: lesson.scheduledDate,
      scheduledDateType: typeof lesson.scheduledDate,
      teacherId: lesson.teacherId,
      studentsCount: lesson.students?.length || 0,
      students: lesson.students?.map(s => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName
      })) || [],
      status: lesson.status,
      recurrenceType: lesson.recurrenceType,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      // Attendance debugging
      totalAttendanceRecords: allAttendance.length,
      currentOccurrenceAttendanceCount: currentOccurrenceAttendance.length,
      allAttendance: allAttendance.map(record => ({
        id: record.id,
        studentId: record.studentId,
        studentName: record.student ? `${record.student.firstName} ${record.student.lastName}` : 'Unknown',
        status: record.status,
        attendanceTime: record.attendanceTime,
        createdAt: record.createdAt,
        markedBy: record.markedBy
      })),
      currentOccurrenceAttendance: currentOccurrenceAttendance.map(record => ({
        id: record.id,
        studentId: record.studentId,
        studentName: record.student ? `${record.student.firstName} ${record.student.lastName}` : 'Unknown',
        status: record.status,
        attendanceTime: record.attendanceTime,
        createdAt: record.createdAt,
        markedBy: record.markedBy
      })),
      dateRange: {
        lessonDate: lessonScheduledDate.toISOString(),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString()
      }
    };
  }
} 