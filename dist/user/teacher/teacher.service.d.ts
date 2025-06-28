import { Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { Student } from '../student/student.entity';
import { CreateTeacherDto } from './create-teacher.dto';
import { Lesson } from '../../lesson/entities/lesson.entity';
import { User } from '../../user/entities/user.entity';
import { LessonAttendance } from '../../lesson/entities/lesson-attendance.entity';
export declare class TeacherService {
    private teacherRepository;
    private studentRepository;
    private lessonRepository;
    private userRepository;
    private attendanceRepository;
    constructor(teacherRepository: Repository<Teacher>, studentRepository: Repository<Student>, lessonRepository: Repository<Lesson>, userRepository: Repository<User>, attendanceRepository: Repository<LessonAttendance>);
    create(createTeacherDto: CreateTeacherDto, user: User): Promise<Teacher>;
    findAll(): Promise<{
        teachers: User[];
    }>;
    findOne(userId: string): Promise<Teacher>;
    update(userId: string, updateTeacherDto: Partial<CreateTeacherDto>): Promise<Teacher>;
    remove(userId: string): Promise<void>;
    getTeacherStudents(userId: string): Promise<{
        students: any[];
    }>;
    getTeacherLessons(userId: string): Promise<{
        lessons: Lesson[];
    }>;
    createWithUser(user: User): Promise<Teacher>;
    addStudentToTeacher(teacherId: string, studentId: string): Promise<void>;
}
