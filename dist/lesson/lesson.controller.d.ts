import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UnsubscribeLessonDto } from './dto/unsubscribe-lesson.dto';
import { AddStudentToLessonDto } from './dto/add-student-to-lesson.dto';
import { RemoveStudentFromLessonDto } from './dto/remove-student-from-lesson.dto';
import { TransferStudentDto } from './dto/transfer-student.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { LessonStatus } from './entities/lesson.entity';
import { StatsPeriod } from './dto/teacher-stats.dto';
export declare class LessonController {
    private readonly lessonService;
    constructor(lessonService: LessonService);
    create(createLessonDto: CreateLessonDto, user: any): Promise<{
        lesson: import("./entities/lesson.entity").Lesson;
    }>;
    findAll(scheduledDate: string, sectionId: string, branchId: string): Promise<{
        lessons: any[];
    }>;
    findBySubject(subject: string): Promise<{
        lessons: import("./entities/lesson.entity").Lesson[];
    }>;
    getLessonsByTeacher(teacherId: string): Promise<{
        lessons: import("./entities/lesson.entity").Lesson[];
    }>;
    getLessonsByDate(date: string): Promise<{
        lessons: import("./entities/lesson.entity").Lesson[];
    }>;
    getTodayLessons(date?: string, subject?: string, status?: LessonStatus, grade?: string): Promise<{
        lessons: import("./entities/lesson.entity").Lesson[];
    }>;
    findOne(id: string): Promise<{
        lesson: import("./entities/lesson.entity").Lesson;
    }>;
    getLessonStudents(id: string): Promise<{
        students: import("../user/student/student.entity").Student[];
    }>;
    startAttendance(lessonId: string, user: any): Promise<{
        lesson: import("./entities/lesson.entity").Lesson;
    }>;
    markAttendance(markAttendanceDto: MarkAttendanceDto, user: any): Promise<{
        attendance: import("./entities/lesson-attendance.entity").LessonAttendance;
    }>;
    getLessonAttendance(id: string, date?: string): Promise<{
        attendance: import("./entities/lesson-attendance.entity").LessonAttendance[];
    }>;
    getStudentAttendanceHistory(studentId: string): Promise<{
        attendanceHistory: import("./entities/lesson-attendance.entity").LessonAttendance[];
    }>;
    startLesson(lessonId: string, user: any): Promise<{
        lesson: import("./entities/lesson.entity").Lesson;
    }>;
    completeLesson(lessonId: string, user: any): Promise<any>;
    reopenLesson(lessonId: string, user: any): Promise<{
        lesson: import("./entities/lesson.entity").Lesson;
    }>;
    getUpcomingLessons(): Promise<{
        lessons: import("./entities/lesson.entity").Lesson[];
    }>;
    getCompletedLessons(): Promise<{
        lessons: import("./entities/lesson.entity").Lesson[];
    }>;
    update(id: string, updateLessonDto: Partial<CreateLessonDto>, user: any): Promise<import("./entities/lesson.entity").Lesson>;
    remove(id: string, user: any): Promise<void>;
    addStudentToLesson(addStudentDto: AddStudentToLessonDto, user: any): Promise<{
        lessonId: string;
        studentId: string;
        studentPhoneNumber: string | null;
        firstName: string;
        lastName: string;
    }>;
    transferStudentToLesson(transferStudentDto: TransferStudentDto, user: any): Promise<{
        message: string;
    }>;
    removeStudentFromLesson(removeStudentDto: RemoveStudentFromLessonDto, user: any): Promise<{
        lesson: import("./entities/lesson.entity").Lesson;
    }>;
    unsubscribeFromLesson(unsubscribeDto: UnsubscribeLessonDto): Promise<{
        lesson: import("./entities/lesson.entity").Lesson;
    }>;
    getStudentSubscriptions(studentId: string): Promise<{
        subscriptions: import("./entities/lesson.entity").Lesson[];
    }>;
    checkStudentSubscription(studentId: string, lessonId: string): Promise<boolean>;
    getTeacherTodayLessons(teacherId: string, subject?: string, status?: LessonStatus, date?: string): Promise<{
        lessons: import("./entities/lesson.entity").Lesson[];
    }>;
    getTeacherStats(teacherId: string, period: StatsPeriod, startDate?: string, endDate?: string): Promise<import("./dto/teacher-stats.dto").TeacherStatsResponse>;
    getAllLessonsForTeacher(teacherId: string): Promise<any>;
    initializeTeacherStats(teacherId: string): Promise<{
        message: string;
    }>;
    recalculateTeacherStats(teacherId: string): Promise<{
        message: string;
    }>;
    resetTeacherStats(teacherId: string): Promise<{
        message: string;
    }>;
    debugTeacherLessons(teacherId: string): Promise<any>;
    getTeacherStatsByDate(teacherId: string, startDate: string, endDate: string): Promise<any>;
    debugLessonData(id: string): Promise<any>;
    debugTeacherStats(teacherId: string): Promise<any>;
    clearTeacherStats(teacherId: string): Promise<{
        message: string;
    }>;
}
