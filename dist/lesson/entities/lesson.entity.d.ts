import { Teacher } from '../../user/teacher/teacher.entity';
import { Student } from '../../user/student/student.entity';
export declare enum LessonRecurrenceType {
    NONE = "none",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly"
}
export declare enum LessonStatus {
    SCHEDULED = "scheduled",
    ATTENDANCE_OPEN = "attendance_open",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    EXPIRED = "expired"
}
export declare class Lesson {
    id: string;
    title: string;
    description: string;
    subject: string;
    scheduledDate: Date;
    startTime: Date;
    endTime: Date;
    attendanceStartTime: Date;
    room: string;
    recurrenceType: LessonRecurrenceType;
    recurrencePattern: any;
    status: LessonStatus;
    inutes: any;
    createdAt: Date;
    updatedAt: Date;
    teacherId: string;
    teacher: Teacher;
    students: Student[];
    price: number;
    grade?: string;
}
