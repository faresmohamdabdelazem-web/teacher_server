import { AttendanceStatus } from '../entities/lesson-attendance.entity';
export declare class MarkAttendanceDto {
    lessonId: string;
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
}
