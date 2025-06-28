import { Repository } from 'typeorm';
import { TeacherStats, StatsPeriod } from './entities/teacher-stats.entity';
import { Lesson, LessonStatus } from './entities/lesson.entity';
import { LessonAttendance } from './entities/lesson-attendance.entity';
export declare class TeacherStatsService {
    private teacherStatsRepository;
    private lessonRepository;
    private attendanceRepository;
    constructor(teacherStatsRepository: Repository<TeacherStats>, lessonRepository: Repository<Lesson>, attendanceRepository: Repository<LessonAttendance>);
    onLessonCreated(lesson: Lesson): Promise<void>;
    onStudentAddedToLesson(lessonId: string): Promise<void>;
    onStudentRemovedFromLesson(lessonId: string): Promise<void>;
    onAttendanceMarked(lessonId: string): Promise<void>;
    onLessonStatusChanged(lesson: Lesson, oldStatus?: LessonStatus, originalDate?: Date): Promise<void>;
    onLessonCompleted(lesson: Lesson): Promise<void>;
    private updateStatsForLesson;
    private updateStatsForLessonWithDate;
    private updateDailyStats;
    private updateWeeklyStats;
    private updateMonthlyStats;
    private getWeekStart;
    getTeacherStats(teacherId: string, period: StatsPeriod, startDate?: string, endDate?: string): Promise<any>;
    initializeStatsForTeacher(teacherId: string): Promise<void>;
    private updateWeeklyStatsFromDaily;
    private updateMonthlyStatsFromDaily;
    recalculateTeacherStats(teacherId: string): Promise<void>;
    clearTeacherStats(teacherId: string): Promise<void>;
    resetAndRecalculateTeacherStats(teacherId: string): Promise<void>;
}
