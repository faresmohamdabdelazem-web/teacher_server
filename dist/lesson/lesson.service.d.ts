import { Repository } from 'typeorm';
import { Lesson, LessonStatus } from './entities/lesson.entity';
import { LessonAttendance } from './entities/lesson-attendance.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { SubscribeLessonDto } from './dto/subscribe-lesson.dto';
import { UnsubscribeLessonDto } from './dto/unsubscribe-lesson.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { StartAttendanceDto } from './dto/start-attendance.dto';
import { StatsPeriod, TeacherStatsResponse } from './dto/teacher-stats.dto';
import { Teacher } from '../user/teacher/teacher.entity';
import { Student } from '../user/student/student.entity';
import { UserService } from '../user/user.service';
import { TeacherStatsService } from './teacher-stats.service';
import { WhatsAppService } from '../notification/whatsapp.service';
export declare class LessonService {
    private lessonRepository;
    private attendanceRepository;
    private teacherRepository;
    private studentRepository;
    private readonly userService;
    readonly teacherStatsService: TeacherStatsService;
    private readonly whatsAppService;
    constructor(lessonRepository: Repository<Lesson>, attendanceRepository: Repository<LessonAttendance>, teacherRepository: Repository<Teacher>, studentRepository: Repository<Student>, userService: UserService, teacherStatsService: TeacherStatsService, whatsAppService: WhatsAppService);
    create(createLessonDto: CreateLessonDto, userId: string, userRole: string): Promise<{
        lesson: Lesson;
        teacher: Teacher;
    }>;
    private checkAndUpdateExpiredLessons;
    findAll(): Promise<{
        lessons: any[];
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
        lessonId: string;
        studentId: string;
        studentPhoneNumber: string | null;
        firstName: string;
        lastName: string;
    }>;
    transferStudentToLesson(studentId: string, toLessonId: string, userId: string, userRole: string): Promise<{
        message: string;
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
    getTodayLessons(date?: string, subject?: string, status?: LessonStatus, grade?: string): Promise<{
        lessons: Lesson[];
    }>;
    startAttendance(startAttendanceDto: StartAttendanceDto, userId: string, userRole: string): Promise<{
        lesson: Lesson;
    }>;
    markAttendance(markAttendanceDto: MarkAttendanceDto, userId: string, userRole: string): Promise<{
        attendance: LessonAttendance;
    }>;
    getLessonAttendance(lessonId: string, date?: string): Promise<{
        attendance: LessonAttendance[];
    }>;
    getLessonAttendanceHistory(lessonId: string, startDate: string, endDate: string): Promise<{
        attendance: LessonAttendance[];
    }>;
    getLessonAttendanceForDate(lessonId: string, date: string): Promise<{
        attendance: LessonAttendance[];
    }>;
    getStudentAttendanceHistory(studentId: string): Promise<{
        attendanceHistory: LessonAttendance[];
    }>;
    startLesson(lessonId: string, userId: string, userRole: string): Promise<{
        lesson: Lesson;
    }>;
    completeLesson(lessonId: string): Promise<any>;
    private sendAbsenceNotifications;
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
    getTeacherTodayLessons(teacherId: string, subject?: string, status?: LessonStatus, date?: string): Promise<{
        lessons: Lesson[];
    }>;
    calculateTeacherStats(teacherId: string, period: StatsPeriod, startDate?: string, endDate?: string): Promise<TeacherStatsResponse>;
    getAllTeacherLessons(teacherId: string): Promise<{
        lessons: Lesson[];
    }>;
    initializeTeacherStats(teacherId: string): Promise<void>;
    recalculateTeacherStats(teacherId: string): Promise<void>;
    resetTeacherStats(teacherId: string): Promise<void>;
    debugTeacherLessons(teacherId: string): Promise<any>;
    getTeacherStatsByDate(teacherId: string, startDate: string, endDate: string): Promise<any>;
    getAllLessonsForTeacher(teacherId: string): Promise<any>;
    private markAbsentStudentsWithoutAttendance;
    debugLessonData(lessonId: string): Promise<any>;
}
