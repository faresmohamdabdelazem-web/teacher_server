import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Or } from 'typeorm';
import { Teacher } from './teacher.entity';
import { Student } from '../student/student.entity';
import { CreateTeacherDto } from './create-teacher.dto';
import { UUID } from 'typeorm/driver/mongodb/bson.typings';
import { isUUID } from 'class-validator';
import { Lesson, LessonStatus } from '../../lesson/entities/lesson.entity';
import { User } from '../../user/entities/user.entity';
import { UserRole } from '../user.role.enum';
import { LessonAttendance } from '../../lesson/entities/lesson-attendance.entity';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(LessonAttendance)
    private attendanceRepository: Repository<LessonAttendance>,
  ) { }

async create(createTeacherDto: CreateTeacherDto, user: User): Promise<Teacher> {
  const { firstName, lastName } = createTeacherDto;

  // Check if a teacher already exists with the same first and last name
 const existingTeacher = await this.teacherRepository
  .createQueryBuilder('teacher')
  .where('LOWER(teacher.firstName) = LOWER(:firstName)', { firstName })
  .andWhere('LOWER(teacher.lastName) = LOWER(:lastName)', { lastName })
  .getOne();


  if (existingTeacher) {
    throw new BadRequestException(
      'اسم المعلم بالكامل موجود من فضلك غير الاسم الاول او السم الثاني',
    );
  }

  // Create new teacher
  const teacher = this.teacherRepository.create({
    id: user.userId,
    user,
    ...createTeacherDto,
  });

  return await this.teacherRepository.save(teacher);
}


  async findAll(): Promise<{ teachers: User[] }> {
    const teachers = await this.userRepository.find({
      where: { role: UserRole.TEACHER },
      relations: ['teacher', 'teacher.lessons'],
    });
    return { teachers };
  }

  async findOne(userId: string): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: userId },
      relations: ['user', 'lessons'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async update(userId: string, updateTeacherDto: Partial<CreateTeacherDto>): Promise<Teacher> {
    const teacher = await this.findOne(userId);
    // Only update fields that exist on Teacher entity
    // (userId, user, etc.)
    Object.assign(teacher, updateTeacherDto);
    return await this.teacherRepository.save(teacher);
  }

  async remove(userId: string): Promise<void> {
    const teacher = await this.findOne(userId);
    await this.teacherRepository.remove(teacher);
  }

  async getTeacherStudents(userId: string): Promise<{ students: any[] }> {
    if (!isUUID(userId)) {
      throw new BadRequestException('Invalid teacher ID');
    }
    const teacher = await this.teacherRepository.findOne({
      where: { id: userId },
      relations: ['students'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const students = await this.studentRepository.find({
      where: { teachers: { id: userId } },
      relations: ['teachers', 'lessons'],
    });

    // Add lessons with attendance history to each student
    const studentsWithLessons = await Promise.all(
      students.map(async (student) => {
        // Add attendance history to each lesson (filtered by current occurrence date)
        const lessonsWithAttendance = await Promise.all(
          student.lessons.map(async (lesson) => {
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

        return {
          ...student,
          lessons: lessonsWithAttendance
        };
      })
    );

    return {
      students: studentsWithLessons,
    };
  }

  async getTeacherLessons(
    userId: string,
    date?: string,
    subject?: string,
    status?: LessonStatus,
    grade?: string
  ): Promise<{ lessons: Lesson[] }> {
    if (!isUUID(userId)) {
      throw new BadRequestException('Invalid teacher ID');
    }
    const teacher = await this.teacherRepository.findOne({
      where: { id: userId },
      relations: ['students'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Build the where clause with filters
    const whereClause: any = { teacher: { id: userId } };

    // Add date filter if provided
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
      whereClause.scheduledDate = Between(startOfDay, endOfDay);
    }

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
            // createdAt: Between(startOfDay, endOfDay)
          },
          relations: ['student', 'lesson'],
          order: { lesson: { scheduledDate: 'ASC' } }
        });

        return {
          ...lesson,
          attendanceHistory: attendance
        };
      })
    );

    return {
      lessons: lessonsWithAttendance,
    };
  }

  async createWithUser(user: User) {
    const teacher = this.teacherRepository.create({ id: user.userId, user });
    return await this.teacherRepository.save(teacher);
  }

  async addStudentToTeacher(teacherId: string, studentId: string): Promise<void> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
      relations: ['students'],
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('هذا الطالب غير موجود');

    // Avoid duplicates
    if (!teacher.students.some(s => s.id === studentId)) {
      teacher.students.push(student);
      await this.teacherRepository.save(teacher);
    }
  }
} 