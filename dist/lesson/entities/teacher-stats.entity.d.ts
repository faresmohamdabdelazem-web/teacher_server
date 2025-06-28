import { Teacher } from '../../user/teacher/teacher.entity';
export declare enum StatsPeriod {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly"
}
export declare class TeacherStats {
    id: string;
    teacherId: string;
    teacher: Teacher;
    period: StatsPeriod;
    date: Date;
    totalLessons: number;
    totalStudents: number;
    totalAttendance: number;
    totalEarnings: number;
    averageEarningsPerLesson: number;
    averageStudentsPerLesson: number;
    completionRate: number;
    completedLessons: number;
    cancelledLessons: number;
    expiredLessons: number;
    createdAt: Date;
    updatedAt: Date;
}
