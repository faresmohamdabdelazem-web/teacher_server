import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import {
  Lesson,
  LessonStatus,
  LessonRecurrenceType,
} from './entities/lesson.entity';
import {
  LessonAttendance,
  AttendanceStatus,
} from './entities/lesson-attendance.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { SubscribeLessonDto } from './dto/subscribe-lesson.dto';
import { UnsubscribeLessonDto } from './dto/unsubscribe-lesson.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { Assistant } from 'src/user/assistant/assistant.entity';
import { StartAttendanceDto } from './dto/start-attendance.dto';
import {
  TeacherStatsDto,
  StatsPeriod,
  TeacherStatsResponse,
} from './dto/teacher-stats.dto';
import { Teacher } from '../user/teacher/teacher.entity';
import { Student } from '../user/student/student.entity';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/user.role.enum';
import { MoreThan } from 'typeorm';
import { TeacherStatsService } from './teacher-stats.service';
import { WhatsAppService } from '../notification/whatsapp.service';
import { StudentService } from '../user/student/student.service';
import { Section } from 'src/section/entities/section.entity';
@Injectable()
export class LessonService {
  constructor(
      // ✅ أضف هذا
  @InjectRepository(Assistant)
  private readonly assistantRepository: Repository<Assistant>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(LessonAttendance)
    private attendanceRepository: Repository<LessonAttendance>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,

 @InjectRepository(Section)
  private readonly sectionRepository: Repository<Section>,

    private readonly userService: UserService,
    public readonly teacherStatsService: TeacherStatsService,
    private readonly whatsAppService: WhatsAppService,
    private studentservice: StudentService,
  ) {}

async create(
  createLessonDto: CreateLessonDto,
  userId: string,
  userRole: string,
): Promise<{ lesson: Lesson }> {
  if (
    userRole !== UserRole.TEACHER &&
    userRole !== UserRole.ASSISTANT &&
    userRole !== UserRole.ADMIN
  ) {
    throw new ForbiddenException(
      'Only teachers, assistants, or admins can create lessons',
    );
  }

  const user = await this.userService.findOneById(userId);
  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (!createLessonDto['sectionId']) {
    throw new BadRequestException('Section ID is required to create a lesson');
  }

  const section = await this.sectionRepository.findOne({
    where: { id: createLessonDto['sectionId'] },
    relations: ['branches'],
  });

  if (!section) {
    throw new NotFoundException('Section not found');
  }

  if (userRole === UserRole.ASSISTANT) {
    const assistant = await this.assistantRepository.findOne({
      where: { userId: user.userId },
      relations: ['branch'],
    });

    if (!assistant || !assistant.branch) {
      throw new ForbiddenException('Assistant has no assigned branch');
    }

    const sectionBranchIds = section.branches.map((b) => b.id);
    const isInSameBranch = sectionBranchIds.includes(assistant.branch.id);

    if (!isInSameBranch) {
      throw new ForbiddenException(
        'Assistant can only create lessons in sections belonging to their own branch',
      );
    }
  }

  if (createLessonDto.startTime) {
    const startTime = new Date(createLessonDto.startTime);
    createLessonDto['attendanceStartTime'] = new Date(
      startTime.getTime() - 60 * 60 * 1000,
    );
  }

  if (createLessonDto.scheduledDate) {
    const scheduledDate = new Date(createLessonDto.scheduledDate);
    const now = new Date();

    // ✅ تحقق أن التاريخ مش قبل دلوقتي
    if (scheduledDate < now) {
      throw new BadRequestException(
        'لا يمكنك انشاء محاضرة في وقت في الماضي',
      );
    }

    createLessonDto.scheduledDate = scheduledDate.toISOString() as any;
  }

  const lesson = this.lessonRepository.create({
    ...createLessonDto,
    status: LessonStatus.SCHEDULED,
  });

  const savedLesson = await this.lessonRepository.save(lesson);

  // ✅ إنشاء سجلات الحضور التلقائية
  if (savedLesson && savedLesson.sectionId) {
    const studentsInSection = await this.studentRepository.find({
      where: { sectionId: savedLesson.sectionId },
    });

    if (studentsInSection.length > 0) {
      const attendanceRecords = studentsInSection.map((student) =>
        this.attendanceRepository.create({
          lessonId: savedLesson.id,
          studentId: student.id,
          status: AttendanceStatus.ABSENT,
          markedBy: 'system',
          attendanceTime: savedLesson.scheduledDate,
        }),
      );

      await this.attendanceRepository.save(attendanceRecords);
    }
  }

  return { lesson: savedLesson };
}




  private async checkAndUpdateExpiredLessons(lessons: Lesson[]): Promise<void> {
    const now = new Date();
    const lessonsToUpdate: Lesson[] = [];

    for (const lesson of lessons) {
      if (
        lesson.status !== LessonStatus.COMPLETED &&
        lesson.status !== LessonStatus.CANCELLED &&
        lesson.status !== LessonStatus.EXPIRED
      ) {
        let lessonEndTime: Date;

        if (lesson.endTime) {
          lessonEndTime = new Date(lesson.endTime);
        } else if (lesson.startTime) {
          lessonEndTime = new Date(lesson.startTime.getTime() + 60 * 60 * 1000);
        } else if (lesson.scheduledDate) {
          const lessonDate = new Date(lesson.scheduledDate);
          lessonEndTime = new Date(lessonDate.getTime() + 2 * 60 * 60 * 1000);
        } else {
          continue;
        }

        const expirationTime = new Date(
          lessonEndTime.getTime() + 2 * 60 * 60 * 1000,
        );

        if (
          now > expirationTime &&
          lesson.recurrenceType === LessonRecurrenceType.NONE
        ) {
          lesson.status = LessonStatus.EXPIRED;
          lessonsToUpdate.push(lesson);
        }
      }
    }

    if (lessonsToUpdate.length > 0) {
      await this.lessonRepository.save(lessonsToUpdate);
    }
  }

  async findAll(
  user?: any,
  scheduledDate?: string,
  sectionId?: string,
  branchId?: string,
): Promise<{ lessons: any[] }> {
  const where: any = {};

  // ✅ فلترة حسب التاريخ لو موجود
  if (scheduledDate) {
    const date = new Date(scheduledDate);

    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0,
    );

    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23, 59, 59, 999,
    );

    where.scheduledDate = Between(startOfDay, endOfDay);
  }

  // ✅ فلترة حسب القسم (لو ADMIN أو غيره)
  if (sectionId) {
    where.section = { id: sectionId };
  }

  // ✅ جلب المحاضرات مع العلاقات المطلوبة
  const lessons = await this.lessonRepository.find({
    where,
    relations: ['teacher', 'students', 'section', 'section.branches'],
  });

  let filteredLessons = lessons;

  // ✅ الحالة الأولى: المستخدم مساعد
  if (user.role === UserRole.ASSISTANT) {
    const assistant = await this.assistantRepository.findOne({
      where: { userId: user.id },
      relations: ['branch'],
    });

    if (!assistant || !assistant.branch) {
      return { lessons: [] }; // لو المساعد مش مربوط بفرع
    }

    // فلترة المحاضرات اللي مربوطة بنفس الفرع فقط
    filteredLessons = lessons.filter((lesson) =>
      lesson.section?.branches?.some((b) => b.id === assistant.branch.id),
    );
  }

  // ✅ الحالة الثانية: ADMIN أو غيره
  else if (user.role === UserRole.ADMIN && branchId) {
    filteredLessons = lessons.filter((lesson) =>
      lesson.section?.branches?.some((b) => b.id === branchId),
    );
  }

  // ✅ تحديث حالة المحاضرات المنتهية
  await this.checkAndUpdateExpiredLessons(filteredLessons);

  // ✅ تجهيز البيانات النهائية مع الحضور
  const lessonsWithAttendance = await Promise.all(
    filteredLessons.map(async (lesson) => {
      const lessonDate = new Date(lesson.scheduledDate);

      const startOfDay = new Date(
        lessonDate.getFullYear(),
        lessonDate.getMonth(),
        lessonDate.getDate(),
        0, 0, 0, 0,
      );
      const endOfDay = new Date(
        lessonDate.getFullYear(),
        lessonDate.getMonth(),
        lessonDate.getDate(),
        23, 59, 59, 999,
      );

      const attendance = await this.attendanceRepository.find({
        where: {
          lessonId: lesson.id,
          createdAt: Between(startOfDay, endOfDay),
        },
        relations: ['student'],
        order: { createdAt: 'ASC' },
      });

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        subject: lesson.subject,
        scheduledDate: lesson.scheduledDate,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        room: lesson.room,
        recurrenceType: lesson.recurrenceType,
        status: lesson.status,
        teacherId: lesson.teacherId,
        sectionId: lesson.sectionId,
        sectionName: lesson.section?.name ?? null,
        sectionNameAr: lesson.section?.nameAr ?? null,
        branchNames: lesson.section?.branches?.map((b) => b.name) ?? [],
        branchNamesAr: lesson.section?.branches?.map((b) => b.nameAr) ?? [],
        branchId: lesson.section?.branches?.[0]?.id ?? null,
        price: lesson.price,
        pricingType: lesson.pricingType,
        grade: lesson.grade,
        students: lesson.students,
        attendanceHistory: attendance,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
        teachername: lesson.teachername ?? 'Teacher',
      };
    }),
  );

  return { lessons: lessonsWithAttendance };
}


  async findOne(id: string): Promise<{ lesson: Lesson }> {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: ['teacher', 'students', 'section', 'branch'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.checkAndUpdateExpiredLessons([lesson]);

    const lessonDate = new Date(lesson.scheduledDate);
    const startOfDay = new Date(
      lessonDate.getFullYear(),
      lessonDate.getMonth(),
      lessonDate.getDate(),
    );
    const endOfDay = new Date(
      lessonDate.getFullYear(),
      lessonDate.getMonth(),
      lessonDate.getDate(),
      23,
      59,
      59,
      999,
    );

    const attendance = await this.attendanceRepository.find({
      where: {
        lessonId: lesson.id,
        createdAt: Between(startOfDay, endOfDay),
      },
      relations: ['student'],
      order: { createdAt: 'ASC' },
    });

    return {
      lesson: {
        ...lesson,
        attendanceHistory: attendance,
      } as any,
    };
  }

  async findBySubject(subject: string): Promise<{ lessons: Lesson[] }> {
    const lessons = await this.lessonRepository.find({
      where: { subject },
      relations: ['teacher', 'students'],
    });

    await this.checkAndUpdateExpiredLessons(lessons);

    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        const lessonDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
        );
        const endOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
          23,
          59,
          59,
          999,
        );

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(startOfDay, endOfDay),
          },
          relations: ['student'],
          order: { createdAt: 'ASC' },
        });

        return {
          ...lesson,
          attendanceHistory: attendance,
        };
      }),
    );

    return { lessons: lessonsWithAttendance };
  }

  async update(
    id: string,
    updateLessonDto: Partial<CreateLessonDto>,
    userId: string,
    userRole: string,
  ): Promise<Lesson> {
    const lesson = await this.findOne(id);

    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ASSISTANT) {
      throw new ForbiddenException(
        'Only teachers and assistants can update lessons',
      );
    }

    if (userRole === UserRole.TEACHER) {
      const user = await this.userService.findOneById(userId);
      if (
        !user ||
        user.role !== UserRole.TEACHER ||
        lesson.lesson.teacherId !== user.userId
      ) {
        throw new ForbiddenException('Teachers can only update their own lessons');
      }
    } else if (userRole === UserRole.ASSISTANT) {
    }

    Object.assign(lesson, updateLessonDto);
    return await this.lessonRepository.save(lesson.lesson);
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const lesson = await this.findOne(id);

    if (
      userRole !== UserRole.TEACHER &&
      userRole !== UserRole.ASSISTANT &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only teachers and assistants can delete lessons',
      );
    }

    if (userRole === UserRole.TEACHER) {
      const user = await this.userService.findOneById(userId);
      if (
        !user ||
        user.role !== UserRole.TEACHER ||
        lesson.lesson.teacherId !== user.userId
      ) {
        throw new ForbiddenException('Teachers can only delete their own lessons');
      }
    } else if (userRole === UserRole.ASSISTANT) {
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
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const lessons = await this.lessonRepository.find({
      where: { teacherId },
      relations: ['teacher', 'students'],
    });

    await this.checkAndUpdateExpiredLessons(lessons);

    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        const lessonDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
        );
        const endOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
          23,
          59,
          59,
          999,
        );

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(startOfDay, endOfDay),
          },
          relations: ['student'],
          order: { createdAt: 'ASC' },
        });

        return {
          ...lesson,
          attendanceHistory: attendance,
        };
      }),
    );

    return { lessons: lessonsWithAttendance };
  }

  async addStudentToLesson(
    lessonId: string,
    studentId: string,
    userId: string,
    userRole: string,
  ): Promise<{
    lessonId: string;
    studentId: string;
    studentPhoneNumber: string | null;
    firstName: string;
    lastName: string;
  }> {
    if (userRole !== UserRole.ASSISTANT && userRole !== UserRole.TEACHER) {
      throw new ForbiddenException(
        'Only assistants and teachers can add students to lessons',
      );
    }

    const user = await this.userService.findOneById(userId);
    if (
      !user ||
      (user.role !== UserRole.ASSISTANT && user.role !== UserRole.TEACHER)
    ) {
      throw new NotFoundException('Assistant or teacher not found');
    }

    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['students'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('هذا الطالب غير موجود');
    }

    if (lesson.grade && student.grade && lesson.grade !== student.grade) {
      throw new BadRequestException(
        `Student grade (${student.grade}) does not match lesson grade (${lesson.grade})`,
      );
    }

    const isAlreadyAdded = lesson.students.some(
      (student) => student.id === studentId,
    );
    if (isAlreadyAdded) {
      throw new ConflictException('Student is already added to this lesson');
    }

    await this.lessonRepository
      .createQueryBuilder()
      .relation(Lesson, 'students')
      .of(lesson)
      .add(studentId);

    await this.teacherStatsService.onStudentAddedToLesson(lessonId);

    return {
      lessonId: lessonId,
      studentId: studentId,
      studentPhoneNumber: student.phoneNumber || null,
      firstName: student.firstName,
      lastName: student.lastName,
    };
  }

  async transferStudentToLesson(
    studentId: string,
    toLessonId: string,
    userId: string,
    userRole: string,
  ): Promise<{ message: string }> {
    if (userRole !== UserRole.ASSISTANT && userRole !== UserRole.TEACHER) {
      throw new ForbiddenException(
        'Only assistants and teachers can transfer students between lessons',
      );
    }

    const user = await this.userService.findOneById(userId);
    if (
      !user ||
      (user.role !== UserRole.ASSISTANT && user.role !== UserRole.TEACHER)
    ) {
      throw new NotFoundException('Assistant or teacher not found');
    }

    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('');
    }

    const toLesson = await this.lessonRepository.findOne({
      where: { id: toLessonId },
      relations: ['students'],
    });
    if (!toLesson) {
      throw new NotFoundException('Destination lesson not found');
    }

    const isInDestinationLesson = toLesson.students.some(
      (s) => s.id === studentId,
    );
    if (isInDestinationLesson) {
      throw new BadRequestException(
        'Student is already enrolled in the destination lesson',
      );
    }

    if (toLesson.grade && student.grade && toLesson.grade !== student.grade) {
      throw new BadRequestException(
        `Student grade (${student.grade}) does not match destination lesson grade (${toLesson.grade})`,
      );
    }

    const currentLesson = await this.lessonRepository
      .createQueryBuilder('lesson')
      .leftJoinAndSelect('lesson.students', 'student')
      .where('student.id = :studentId', { studentId })
      .getOne();

    if (!currentLesson) {
      throw new BadRequestException('Student is not enrolled in any lesson');
    }

    if (currentLesson.id === toLessonId) {
      throw new BadRequestException(
        'Student is already enrolled in the destination lesson',
      );
    }

    await this.lessonRepository
      .createQueryBuilder()
      .relation(Lesson, 'students')
      .of(currentLesson)
      .remove(studentId);

    await this.lessonRepository
      .createQueryBuilder()
      .relation(Lesson, 'students')
      .of(toLesson)
      .add(studentId);

    await this.teacherStatsService.onStudentRemovedFromLesson(currentLesson.id);
    await this.teacherStatsService.onStudentAddedToLesson(toLessonId);

    return { message: 'Student transferred successfully' };
  }

  async removeStudentFromLesson(
    lessonId: string,
    studentId: string,
    userId: string,
    userRole: string,
  ): Promise<{ lesson: Lesson }> {
    if (userRole !== UserRole.ASSISTANT && userRole !== UserRole.TEACHER) {
      throw new ForbiddenException(
        'Only assistants and teachers can remove students from lessons',
      );
    }

    const user = await this.userService.findOneById(userId);
    if (
      !user ||
      (user.role !== UserRole.ASSISTANT && user.role !== UserRole.TEACHER)
    ) {
      throw new NotFoundException('Assistant or teacher not found');
    }

    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['students'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const isAdded = lesson.students.some((student) => student.id === studentId);
    if (!isAdded) {
      throw new ConflictException('Student is not added to this lesson');
    }

    await this.lessonRepository
      .createQueryBuilder()
      .relation(Lesson, 'students')
      .of(lesson)
      .remove(studentId);

    await this.teacherStatsService.onStudentRemovedFromLesson(lessonId);

    return await this.findOne(lessonId);
  }

  async subscribeToLesson(
    subscribeDto: SubscribeLessonDto,
  ): Promise<{ lesson: Lesson }> {
    throw new ForbiddenException(
      'Students cannot subscribe themselves. Only assistants can add students to lessons.',
    );
  }

  async unsubscribeFromLesson(
    unsubscribeDto: UnsubscribeLessonDto,
  ): Promise<{ lesson: Lesson }> {
    const { studentId, lessonId } = unsubscribeDto;

    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['students'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const isSubscribed = lesson.students.some(
      (student) => student.id === studentId,
    );
    if (!isSubscribed) {
      throw new ConflictException('Student is not subscribed to this lesson');
    }

    await this.lessonRepository
      .createQueryBuilder()
      .relation(Lesson, 'students')
      .of(lesson)
      .remove(studentId);

    return await this.findOne(lessonId);
  }

  async getStudentSubscriptions(
    studentId: string,
  ): Promise<{ subscriptions: Lesson[] }> {
    const lessons = await this.lessonRepository
      .createQueryBuilder('lesson')
      .leftJoinAndSelect('lesson.students', 'student')
      .where('student.id = :studentId', { studentId })
      .getMany();

    return { subscriptions: lessons };
  }

  async checkStudentSubscription(
    studentId: string,
    lessonId: string,
  ): Promise<boolean> {
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

    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        const lessonDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
        );
        const endOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
          23,
          59,
          59,
          999,
        );

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(startOfDay, endOfDay),
          },
          relations: ['student'],
          order: { createdAt: 'ASC' },
        });

        return {
          ...lesson,
          attendanceHistory: attendance,
        };
      }),
    );

    return { lessons: lessonsWithAttendance };
  }

  async getTodayLessons(
    date?: string,
    subject?: string,
    status?: LessonStatus,
    grade?: string,
  ): Promise<{ lessons: Lesson[] }> {
    let startOfDay: Date;
    let endOfDay: Date;

    if (date) {
      const targetDate = new Date(date);
      startOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
      );
      endOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        23,
        59,
        59,
        999,
      );
    } else {
      const today = new Date();
      startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999,
      );
    }

    const whereClause: any = {
      scheduledDate: Between(startOfDay, endOfDay),
    };

    if (subject) {
      whereClause.subject = subject;
    }

    if (status) {
      whereClause.status = status;
    }

    if (grade) {
      whereClause.grade = grade;
    }

    const lessons = await this.lessonRepository.find({
      where: whereClause,
      relations: ['teacher', 'students'],
      order: { startTime: 'ASC' },
    });

    await this.checkAndUpdateExpiredLessons(lessons);

    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        const lessonDate = new Date(lesson.scheduledDate);
        const lessonStartOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
        );
        const lessonEndOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
          23,
          59,
          59,
          999,
        );

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(lessonStartOfDay, lessonEndOfDay),
          },
          relations: ['student'],
          order: { createdAt: 'ASC' },
        });

        return {
          ...lesson,
          attendanceHistory: attendance,
        };
      }),
    );

    return { lessons: lessonsWithAttendance };
  }

  async startAttendance(
    startAttendanceDto: StartAttendanceDto,
    userId: string,
    userRole: string,
  ): Promise<{ lesson: Lesson }> {
    if (
      userRole !== UserRole.TEACHER &&
      userRole !== UserRole.ASSISTANT &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only teachers,admin and assistants can start attendance',
      );
    }

    const lesson = await this.findOne(startAttendanceDto.lessonId);

    const now = new Date();
    const attendanceStartTime = lesson.lesson.attendanceStartTime;

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const scheduledDate = new Date(lesson.lesson.scheduledDate);
    const lessonDate = new Date(
      scheduledDate.getFullYear(),
      scheduledDate.getMonth(),
      scheduledDate.getDate(),
    );

    if (today < lessonDate) {
      throw new BadRequestException(
        'Attendance cannot be started before the scheduled date',
      );
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lessonDate < yesterday) {
      throw new BadRequestException(
        'Attendance cannot be started for lessons that are more than 1 day in the past',
      );
    }

    if (!attendanceStartTime) {
      throw new BadRequestException('Lesson does not have a scheduled start time');
    }

    if (now < attendanceStartTime) {
      throw new BadRequestException(
        'Attendance can only be started 1 hour before the lesson',
      );
    }

    if (
      lesson.lesson.status !== LessonStatus.SCHEDULED &&
      lesson.lesson.status !== LessonStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Attendance can only be started for scheduled or completed recurring lessons',
      );
    }

    if (lesson.lesson.status === LessonStatus.COMPLETED) {
      if (lesson.lesson.recurrenceType === LessonRecurrenceType.NONE) {
        throw new BadRequestException(
          'Non-recurring completed lessons cannot be reopened',
        );
      }

      await this.reopenLesson(startAttendanceDto.lessonId, userId, userRole);
    }

    lesson.lesson.status = LessonStatus.ATTENDANCE_OPEN;
    await this.lessonRepository.save(lesson.lesson);

    return { lesson: lesson.lesson };
  }

 async markAttendance(
  markAttendanceDto: MarkAttendanceDto,
  userId: string,
  userRole: string,
): Promise<{ attendance: LessonAttendance }> {
  if (
    userRole !== UserRole.TEACHER &&
    userRole !== UserRole.ASSISTANT &&
    userRole !== UserRole.ADMIN
  ) {
    throw new ForbiddenException(
      'Only teachers, assistants, and admins can mark attendance',
    );
  }

  const lesson = await this.lessonRepository.findOne({
    where: { id: markAttendanceDto.lessonId },
    relations: ['section', 'section.branches'],
  });

  if (!lesson) {
    throw new NotFoundException(
      `Lesson with ID ${markAttendanceDto.lessonId} not found`,
    );
  }

  if (
    lesson.status !== LessonStatus.ATTENDANCE_OPEN &&
    lesson.status !== LessonStatus.IN_PROGRESS
  ) {
    throw new BadRequestException(
      'Attendance can only be marked when lesson is open for attendance or in progress',
    );
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lessonDate = new Date(lesson.scheduledDate);
  const normalizedLessonDate = new Date(
    lessonDate.getFullYear(),
    lessonDate.getMonth(),
    lessonDate.getDate(),
  );

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (normalizedLessonDate < yesterday) {
    throw new BadRequestException(
      'Attendance cannot be marked for lessons more than 1 day old',
    );
  }

  const student = await this.studentRepository.findOne({
    where: { id: markAttendanceDto.studentId },
    relations: ['branch'],
  });

  if (!student) {
    throw new NotFoundException(
      `Student with ID ${markAttendanceDto.studentId} not found`,
    );
  }

  if (student.branch.id !== lesson.section?.branches?.[0]?.id) {
    throw new BadRequestException(
      'Student and lesson do not belong to the same branch',
    );
  }

  let attendanceRecord = await this.attendanceRepository.findOne({
    where: {
      lessonId: markAttendanceDto.lessonId,
      studentId: markAttendanceDto.studentId,
    },
  });

  let savedAttendance: LessonAttendance;

  if (attendanceRecord) {
    // 🟢 امنع التعديل فقط لو الحالة الحالية "حاضر" و المطلوب الجديد كمان "حاضر"
    if (
      attendanceRecord.status === AttendanceStatus.PRESENT &&
      markAttendanceDto.status === AttendanceStatus.PRESENT
    ) {
      throw new ConflictException(
        'This student is already marked as present.',
      );
    }

    // 🟡 في أي حالة تانية، اسمح بالتحديث
    attendanceRecord.status = markAttendanceDto.status;
    attendanceRecord.attendanceTime = new Date();
    attendanceRecord.notes = markAttendanceDto.notes;
    attendanceRecord.markedBy = userId;
    savedAttendance = await this.attendanceRepository.save(attendanceRecord);
  } else {
    const newAttendance = this.attendanceRepository.create({
      lessonId: markAttendanceDto.lessonId,
      studentId: markAttendanceDto.studentId,
      status: markAttendanceDto.status,
      attendanceTime: new Date(),
      notes: markAttendanceDto.notes,
      markedBy: userId,
    });
    savedAttendance = await this.attendanceRepository.save(newAttendance);
  }

  if (
    markAttendanceDto.status === AttendanceStatus.PRESENT &&
    student.parentPhoneNumber
  ) {
    const studentName = `${student.firstName} ${student.lastName}`;
    await this.whatsAppService.sendPresentNotification(
      student.parentPhoneNumber,
      studentName,
      lesson.title,
      lesson.scheduledDate,
      lesson.subject,
    );
  }

  if (markAttendanceDto.status === AttendanceStatus.PRESENT) {
    await this.studentservice.logPresence(
      markAttendanceDto.studentId,
      lesson.title,
    );
  }

  return { attendance: savedAttendance };
}


async getLessonAttendance(
  lessonId: string,
  date?: string,
): Promise<{ attendance: LessonAttendance[] }> {
  // ✅ نجيب الدرس بالعلاقات الضرورية
  const lesson = await this.lessonRepository.findOne({
    where: { id: lessonId },
    relations: ['section', 'section.branches'], // علشان نعرف الفرع من السيكشن
  });

  if (!lesson) {
    throw new NotFoundException('Lesson not found');
  }

  const sectionId = lesson.section?.id;
  const branchId = lesson.section?.branches?.[0]?.id;

  if (!sectionId || !branchId) {
    throw new NotFoundException('Lesson section or branch not found');
  }

  // ✅ الشرط الأساسي
  let whereCondition: any = {
    lessonId,
    student: {
      sectionId,
      branchId,
    },
  };

  // ✅ فلترة بالتاريخ لو موجود
  if (date) {
    const targetDate = new Date(date);
    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    );
    const endOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      23,
      59,
      59,
      999,
    );

    whereCondition.createdAt = Between(startOfDay, endOfDay);
  }

  // ✅ جلب الحضور بالعلاقات المطلوبة
  const attendance = await this.attendanceRepository.find({
    where: whereCondition,
    relations: ['student', 'lesson', 'student.section', 'student.branch'],
    order: {
      status: 'ASC',
      student: { firstName: 'ASC' },
    },
  });

 
  attendance.sort((a, b) => {
    if (
      a.status === AttendanceStatus.PRESENT &&
      b.status !== AttendanceStatus.PRESENT
    )
      return -1;
    if (
      a.status !== AttendanceStatus.PRESENT &&
      b.status === AttendanceStatus.PRESENT
    )
      return 1;
    return 0;
  });

  return { attendance };
}



  async getStudentAttendanceHistory(
    studentId: string,
  ): Promise<{ attendanceHistory: LessonAttendance[] }> {
    const attendanceHistory = await this.attendanceRepository.find({
      where: { studentId },
      relations: ['lesson'],
      order: { createdAt: 'DESC' },
    });

    return { attendanceHistory };
  }

  async startLesson(
    lessonId: string,
    userId: string,
    userRole: string,
  ): Promise<{ lesson: Lesson }> {
    if (
      userRole !== UserRole.TEACHER &&
      userRole !== UserRole.ASSISTANT &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only teachers and assistants can start lessons',
      );
    }

    const lesson = await this.findOne(lessonId);

    if (
      lesson.lesson.status !== LessonStatus.ATTENDANCE_OPEN &&
      lesson.lesson.status !== LessonStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        'Lesson cannot be started in its current status',
      );
    }

    lesson.lesson.status = LessonStatus.IN_PROGRESS;
    return { lesson: await this.lessonRepository.save(lesson.lesson) };
  }

  async completeLesson(lessonId: string): Promise<any> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['teacher', 'students'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.status !== LessonStatus.IN_PROGRESS) {
      throw new BadRequestException('Lesson must be in progress to complete');
    }

    const currentLessonDate = new Date(lesson.scheduledDate);
    const oldStatus = lesson.status;

    lesson.status = LessonStatus.COMPLETED;
    const completedLesson = await this.lessonRepository.save(lesson);

    await this.markAbsentStudentsWithoutAttendance(lessonId);

    await this.sendAbsenceNotifications(lessonId, currentLessonDate);

    if (lesson.recurrenceType !== LessonRecurrenceType.NONE) {
      const nextDate = this.calculateNextOccurrence(lesson);

      if (nextDate) {
        completedLesson.status = LessonStatus.SCHEDULED;
        completedLesson.scheduledDate = nextDate;

        if (completedLesson.startTime) {
          const originalStartTime = new Date(completedLesson.startTime);
          const newStartTime = new Date(nextDate);
          newStartTime.setHours(
            originalStartTime.getHours(),
            originalStartTime.getMinutes(),
            originalStartTime.getSeconds(),
            originalStartTime.getMilliseconds(),
          );
          completedLesson.startTime = newStartTime;
        }

        if (completedLesson.endTime) {
          const originalEndTime = new Date(completedLesson.endTime);
          const newEndTime = new Date(nextDate);
          newEndTime.setHours(
            originalEndTime.getHours(),
            originalEndTime.getMinutes(),
            originalEndTime.getSeconds(),
            originalEndTime.getMilliseconds(),
          );
          completedLesson.endTime = newEndTime;
        }

        if (completedLesson.startTime) {
          const startTime = new Date(completedLesson.startTime);
          const attendanceStartTime = new Date(
            startTime.getTime() - 60 * 60 * 1000,
          );
          completedLesson.attendanceStartTime = attendanceStartTime;
        }

        await this.lessonRepository.save(completedLesson);
      }
    }

    return {
      lesson: {
        ...completedLesson,
        status: LessonStatus.COMPLETED,
      },
    };
  }

  private async sendAbsenceNotifications(
    lessonId: string,
    lessonDate: Date,
  ): Promise<void> {
    try {
      const lesson = await this.lessonRepository.findOne({
        where: { id: lessonId },
      });

      if (!lesson) {
        return;
      }

      const lessonScheduledDate = new Date(lessonDate);
      const startOfDay = new Date(
        lessonScheduledDate.getFullYear(),
        lessonScheduledDate.getMonth(),
        lessonScheduledDate.getDate(),
      );
      const endOfDay = new Date(
        lessonScheduledDate.getFullYear(),
        lessonScheduledDate.getMonth(),
        lessonScheduledDate.getDate(),
        23,
        59,
        59,
        999,
      );

      const attendance = await this.attendanceRepository.find({
        where: {
          lessonId,
          attendanceTime: Between(startOfDay, endOfDay),
        },
        relations: ['student', 'lesson'],
      });

      const absentStudents = attendance.filter(
        (record) =>
          record.status === AttendanceStatus.ABSENT &&
          record.student?.parentPhoneNumber,
      );

      const notificationPromises = absentStudents.map(
        async (attendanceRecord) => {
          const student = attendanceRecord.student;
          if (student && student.parentPhoneNumber) {
            const studentName = `${student.firstName} ${student.lastName}`;

            return this.whatsAppService.sendAbsenceNotification(
              student.parentPhoneNumber,
              studentName,
              lesson.title,
              lessonDate,
              lesson.subject,
            );
          }
        },
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error sending absence notifications:', error);
    }
  }

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
          const targetDay = lesson.recurrencePattern.dayOfWeek;
          const currentDay = currentDate.getDay();
          const daysToAdd = ((targetDay - currentDay + 7) % 7) || 7;
          nextDate.setDate(currentDate.getDate() + daysToAdd);
        } else {
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

  async reopenLesson(
    lessonId: string,
    userId: string,
    userRole: string,
  ): Promise<{ lesson: Lesson }> {
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ASSISTANT) {
      throw new ForbiddenException(
        'Only teachers and assistants can reopen lessons',
      );
    }

    const lesson = await this.findOne(lessonId);

    if (lesson.lesson.status !== LessonStatus.COMPLETED) {
      throw new BadRequestException('Only completed lessons can be reopened');
    }

    if (lesson.lesson.recurrenceType === LessonRecurrenceType.NONE) {
      throw new BadRequestException('Non-recurring lessons cannot be reopened');
    }

    lesson.lesson.status = LessonStatus.SCHEDULED;

    const nextDate = this.calculateNextOccurrence(lesson.lesson);
    if (nextDate) {
      lesson.lesson.scheduledDate = nextDate;

      if (lesson.lesson.startTime) {
        const originalStartTime = new Date(lesson.lesson.startTime);
        const newStartTime = new Date(nextDate);
        newStartTime.setHours(
          originalStartTime.getHours(),
          originalStartTime.getMinutes(),
          originalStartTime.getSeconds(),
          originalStartTime.getMilliseconds(),
        );
        lesson.lesson.startTime = newStartTime;
      }

      if (lesson.lesson.endTime) {
        const originalEndTime = new Date(lesson.lesson.endTime);
        const newEndTime = new Date(nextDate);
        newEndTime.setHours(
          originalEndTime.getHours(),
          originalEndTime.getMinutes(),
          originalEndTime.getSeconds(),
          originalEndTime.getMilliseconds(),
        );
        lesson.lesson.endTime = newEndTime;
      }

      if (lesson.lesson.startTime) {
        const startTime = new Date(lesson.lesson.startTime);
        const attendanceStartTime = new Date(
          startTime.getTime() - 60 * 60 * 1000,
        );
        lesson.lesson.attendanceStartTime = attendanceStartTime;
      }
    }

    return { lesson: await this.lessonRepository.save(lesson.lesson) };
  }

  async getUpcomingLessons(): Promise<{ lessons: Lesson[] }> {
    const now = new Date();
    const lessons = await this.lessonRepository.find({
      where: {
        scheduledDate: MoreThan(now),
        status: LessonStatus.SCHEDULED,
      },
      relations: ['teacher', 'students'],
      order: { scheduledDate: 'ASC' },
    });

    await this.checkAndUpdateExpiredLessons(lessons);

    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        const lessonDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
        );
        const endOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
          23,
          59,
          59,
          999,
        );

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(startOfDay, endOfDay),
          },
          relations: ['student'],
          order: { createdAt: 'ASC' },
        });

        return {
          ...lesson,
          attendanceHistory: attendance,
        };
      }),
    );

    return { lessons: lessonsWithAttendance };
  }

  async getCompletedLessons(): Promise<{ lessons: Lesson[] }> {
    const lessons = await this.lessonRepository.find({
      where: { status: LessonStatus.COMPLETED },
      relations: ['teacher', 'students'],
      order: { scheduledDate: 'DESC' },
    });

    await this.checkAndUpdateExpiredLessons(lessons);

    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        const lessonDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
        );
        const endOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
          23,
          59,
          59,
          999,
        );

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(startOfDay, endOfDay),
          },
          relations: ['student'],
          order: { createdAt: 'ASC' },
        });

        return {
          ...lesson,
          attendanceHistory: attendance,
        };
      }),
    );

    return { lessons: lessonsWithAttendance };
  }

  async getTeacherTodayLessons(
    teacherId: string,
    subject?: string,
    status?: LessonStatus,
    date?: string,
  ): Promise<{ lessons: Lesson[] }> {
    let startOfDay: Date;
    let endOfDay: Date;

    if (date) {
      const targetDate = new Date(date);
      startOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
      );
      endOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        23,
        59,
        59,
        999,
      );
    } else {
      const today = new Date();
      startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999,
      );
    }

    if (!teacherId) throw new NotFoundException('Teacher Id Not Sent');

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

    await this.checkAndUpdateExpiredLessons(lessons);

    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        const lessonDate = new Date(lesson.scheduledDate);
        const lessonStartOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
        );
        const lessonEndOfDay = new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
          23,
          59,
          59,
          999,
        );

        const attendance = await this.attendanceRepository.find({
          where: {
            lessonId: lesson.id,
            createdAt: Between(lessonStartOfDay, lessonEndOfDay),
          },
          relations: ['student'],
          order: { createdAt: 'ASC' },
        });

        return {
          ...lesson,
          attendanceHistory: attendance,
        };
      }),
    );

    return { lessons: lessonsWithAttendance };
  }

  async calculateTeacherStats(
    teacherId: string,
    period: StatsPeriod,
    startDate?: string,
    endDate?: string,
  ): Promise<TeacherStatsResponse> {
    if (!teacherId) throw new NotFoundException('No TeacherId Found');

    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const statsData = await this.teacherStatsService.getTeacherStats(
      teacherId,
      period,
      startDate,
      endDate,
    );

    const lessons: Array<{ date: string; count: number }> = [];
    const students: Array<{ date: string; count: number }> = [];
    const attendance: Array<{ date: string; count: number }> = [];
    const earnings: Array<{ date: string; amount: number }> = [];

    statsData.stats.forEach((stat) => {
      if (stat.totalLessons > 0) {
        lessons.push({
          date: stat.date,
          count: stat.totalLessons,
        });
      }

      if (stat.totalStudents > 0) {
        students.push({
          date: stat.date,
          count: stat.totalStudents,
        });
      }

      if (stat.totalAttendance > 0) {
        attendance.push({
          date: stat.date,
          count: stat.totalAttendance,
        });
      }

      if (stat.totalEarnings > 0) {
        earnings.push({
          date: stat.date,
          amount: stat.totalEarnings,
        });
      }
    });

    const totalLessons = lessons.reduce((sum, point) => sum + point.count, 0);
    const totalStudents = students.reduce((sum, point) => sum + point.count, 0);
    const totalAttendance = attendance.reduce(
      (sum, point) => sum + point.count,
      0,
    );
    const totalEarnings = earnings.reduce((sum, point) => sum + point.amount, 0);

    const totalCompletedLessons = statsData.stats.reduce(
      (sum, stat) => sum + stat.completedLessons,
      0,
    );
    const completionRate =
      totalLessons > 0 ? (totalCompletedLessons / totalLessons) * 100 : 0;

    const averageEarningsPerLesson =
      totalLessons > 0 ? totalEarnings / totalLessons : 0;
    const averageStudentsPerLesson =
      totalLessons > 0 ? totalStudents / totalLessons : 0;

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
      earnings,
    };
  }

  async getAllTeacherLessons(teacherId: string): Promise<{ lessons: Lesson[] }> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const lessons = await this.lessonRepository.find({
      where: { teacherId },
      relations: ['teacher', 'students'],
      order: { scheduledDate: 'DESC' },
    });

    await this.checkAndUpdateExpiredLessons(lessons);

    const lessonsWithAttendance = await Promise.all(
      lessons.map(async (lesson) => {
        const attendance = await this.attendanceRepository.find({
          where: { lessonId: lesson.id },
          relations: ['student'],
          order: { createdAt: 'ASC' },
        });

        return {
          ...lesson,
          attendanceHistory: attendance,
        };
      }),
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
      relations: ['students'],
    });

    return {
      teacherId,
      totalLessons: lessons.length,
      lessons: lessons.map((lesson) => {
        const lessonDate = lesson.scheduledDate
          ? new Date(lesson.scheduledDate)
          : null;
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
          students: lesson.students.map((student) => ({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
          })),
        };
      }),
    };
  }

  async getTeacherStatsByDate(
    teacherId: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const lessons = await this.lessonRepository.find({
      where: {
        teacherId,
        scheduledDate: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['students'],
    });

    const lessonIds = lessons.map((l) => l.id);
    const attendanceData = await this.attendanceRepository.find({
      where: { lessonId: In(lessonIds) },
    });

    const uniqueStudentIds = new Set();
    lessons.forEach((lesson) => {
      lesson.students?.forEach((student) => {
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
      totalEarnings: lessons.reduce(
        (sum, lesson) => sum + parseFloat(lesson.price?.toString() || '0'),
        0,
      ),
      lessons: lessons.map((lesson) => {
        const lessonDate = lesson.scheduledDate
          ? new Date(lesson.scheduledDate)
          : null;
        return {
          id: lesson.id,
          title: lesson.title,
          scheduledDate: lesson.scheduledDate,
          dateKey: lessonDate ? lessonDate.toISOString().split('T')[0] : null,
          price: lesson.price,
          status: lesson.status,
          studentsCount: lesson.students.length,
        };
      }),
    };
  }

  async getAllLessonsForTeacher(teacherId: string): Promise<any> {
    const lessons = await this.lessonRepository.find({
      where: { teacherId },
      relations: ['students'],
      order: { scheduledDate: 'DESC' },
    });

    return {
      teacherId,
      totalLessons: lessons.length,
      lessons: lessons.map((lesson) => {
        const lessonDate = lesson.scheduledDate
          ? new Date(lesson.scheduledDate)
          : null;
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
          studentsCount: lesson.students.length,
        };
      }),
    };
  }

  private async markAbsentStudentsWithoutAttendance(
    lessonId: string,
  ): Promise<void> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['students'],
    });

    if (!lesson) {
      return;
    }

    const lessonScheduledDate = new Date(lesson.scheduledDate);
    const startOfDay = new Date(
      lessonScheduledDate.getFullYear(),
      lessonScheduledDate.getMonth(),
      lessonScheduledDate.getDate(),
    );
    const endOfDay = new Date(
      lessonScheduledDate.getFullYear(),
      lessonScheduledDate.getMonth(),
      lessonScheduledDate.getDate(),
      23,
      59,
      59,
      999,
    );

    const existingAttendance = await this.attendanceRepository.find({
      where: {
        lessonId,
        attendanceTime: Between(startOfDay, endOfDay),
      },
    });

    const studentsWithoutAttendance = lesson.students.filter(
      (student) =>
        !existingAttendance.some(
          (attendance) => attendance.studentId === student.id,
        ),
    );

    const now = new Date();
    for (const student of studentsWithoutAttendance) {
      const attendance = this.attendanceRepository.create({
        lessonId,
        studentId: student.id,
        status: AttendanceStatus.ABSENT,
        createdAt: now,
        attendanceTime: lessonScheduledDate,
        markedBy: 'system',
      });
      await this.attendanceRepository.save(attendance);
      await this.studentservice.logAbsence(student.id, lesson.title);
    }
  }

  async debugLessonData(lessonId: string): Promise<any> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['teacher', 'students'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const allAttendance = await this.attendanceRepository.find({
      where: { lessonId },
      relations: ['student'],
    });

    const lessonScheduledDate = new Date(lesson.scheduledDate);
    const startOfDay = new Date(
      lessonScheduledDate.getFullYear(),
      lessonScheduledDate.getMonth(),
      lessonScheduledDate.getDate(),
    );
    const endOfDay = new Date(
      lessonScheduledDate.getFullYear(),
      lessonScheduledDate.getMonth(),
      lessonScheduledDate.getDate(),
      23,
      59,
      59,
      999,
    );

    const currentOccurrenceAttendance = allAttendance.filter((record) => {
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
      students:
        lesson.students?.map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
        })) || [],
      status: lesson.status,
      recurrenceType: lesson.recurrenceType,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      totalAttendanceRecords: allAttendance.length,
      currentOccurrenceAttendanceCount: currentOccurrenceAttendance.length,
      allAttendance: allAttendance.map((record) => ({
        id: record.id,
        studentId: record.studentId,
        studentName: record.student
          ? `${record.student.firstName} ${record.student.lastName}`
          : 'Unknown',
        status: record.status,
        attendanceTime: record.attendanceTime,
        createdAt: record.createdAt,
        markedBy: record.markedBy,
      })),
      currentOccurrenceAttendance: currentOccurrenceAttendance.map((record) => ({
        id: record.id,
        studentId: record.studentId,
        studentName: record.student
          ? `${record.student.firstName} ${record.student.lastName}`
          : 'Unknown',
        status: record.status,
        attendanceTime: record.attendanceTime,
        createdAt: record.createdAt,
        markedBy: record.markedBy,
      })),
      dateRange: {
        lessonDate: lessonScheduledDate.toISOString(),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
      },
    };
  }
}