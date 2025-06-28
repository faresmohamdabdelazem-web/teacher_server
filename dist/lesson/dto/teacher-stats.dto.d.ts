export declare enum StatsPeriod {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly"
}
export declare class TeacherStatsDto {
    teacherId: string;
    period: StatsPeriod;
    startDate?: string;
    endDate?: string;
}
export interface TeacherStatsResponse {
    teacherId: string;
    period: StatsPeriod;
    totalLessons: number;
    totalStudents: number;
    totalAttendance: number;
    totalEarnings: number;
    averageEarningsPerLesson: number;
    averageStudentsPerLesson: number;
    completionRate: number;
    lessons: Array<{
        date: string;
        count: number;
    }>;
    students: Array<{
        date: string;
        count: number;
    }>;
    attendance: Array<{
        date: string;
        count: number;
    }>;
    earnings: Array<{
        date: string;
        amount: number;
    }>;
}
