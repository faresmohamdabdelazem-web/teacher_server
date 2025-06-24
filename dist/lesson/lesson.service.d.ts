import { Repository } from 'typeorm';
import { Lesson } from './entities/lesson.entity';
import { LessonAttendance } from './entities/lesson-attendance.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { SubscribeLessonDto } from './dto/subscribe-lesson.dto';
import { UnsubscribeLessonDto } from './dto/unsubscribe-lesson.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { StartAttendanceDto } from './dto/start-attendance.dto';
import { Teacher } from '../user/teacher/teacher.entity';
import { Student } from '../user/student/student.entity';
import { UserService } from '../user/user.service';
export declare class LessonService {
    private lessonRepository;
    private attendanceRepository;
    private teacherRepository;
    private studentRepository;
    private readonly userService;
    constructor(lessonRepository: Repository<Lesson>, attendanceRepository: Repository<LessonAttendance>, teacherRepository: Repository<Teacher>, studentRepository: Repository<Student>, userService: UserService);
    create(createLessonDto: CreateLessonDto, userId: string, userRole: string): Promise<{
        lesson: Lesson;
        teacher: Teacher;
    } | {
        lesson: Lesson;
    }>;
    findAll(): Promise<{
        lessons: Lesson[];
    }>;
    findOne(id: string): Promise<{
        lesson: Lesson;
    }>;
    findBySubject(subject: string): Promise<{
        lessons: Lesson[];
    }>;
    update(id: string, updateLessonDto: Partial<CreateLessonDto>, userId: string, userRole: string): Promise<Lesson>;
    remove(id: string, userId: string, userRole: string): Promise<void>;
    getLessonStudents(id: string): Promise<{
        students: Student[];
    }>;
    getLessonsByTeacher(teacherId: string): Promise<{
        lessons: Lesson[];
    }>;
    addStudentToLesson(lessonId: string, studentId: string, userId: string, userRole: string): Promise<{
        lesson: Lesson;
    }>;
    removeStudentFromLesson(lessonId: string, studentId: string, userId: string, userRole: string): Promise<{
        lesson: Lesson;
    }>;
    subscribeToLesson(subscribeDto: SubscribeLessonDto): Promise<{
        lesson: Lesson;
    }>;
    unsubscribeFromLesson(unsubscribeDto: UnsubscribeLessonDto): Promise<{
        lesson: Lesson;
    }>;
    getStudentSubscriptions(studentId: string): Promise<{
        subscriptions: Lesson[];
    }>;
    checkStudentSubscription(studentId: string, lessonId: string): Promise<boolean>;
    getLessonsByDate(date: string): Promise<{
        lessons: Lesson[];
    }>;
    startAttendance(startAttendanceDto: StartAttendanceDto, userId: string, userRole: string): Promise<{
        lesson: Lesson;
    }>;
    markAttendance(markAttendanceDto: MarkAttendanceDto, userId: string, userRole: string): Promise<LessonAttendance>;
    getLessonAttendance(lessonId: string): Promise<{
        attendance: LessonAttendance[];
    }>;
    getStudentAttendanceHistory(studentId: string): Promise<{
        attendanceHistory: LessonAttendance[];
    }>;
    startLesson(lessonId: string, userId: string, userRole: string): Promise<{
        lesson: Lesson;
    }>;
    completeLesson(lessonId: string, userId: string, userRole: string): Promise<{
        lesson: Lesson;
    }>;
    private scheduleNextOccurrence;
    private calculateNextOccurrence;
    reopenLesson(lessonId: string, userId: string, userRole: string): Promise<{
        lesson: Lesson;
    }>;
    getUpcomingLessons(): Promise<{
        lessons: Lesson[];
    }>;
    getCompletedLessons(): Promise<{
        lessons: Lesson[];
    }>;
}
