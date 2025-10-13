import { Teacher } from '../../user/teacher/teacher.entity';
import { Student } from '../../user/student/student.entity';
import { Section } from 'src/section/entities/section.entity';
import { Branch } from 'src/branch/entities/branch.entity';
import { LessonAttendance } from './lesson-attendance.entity';
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
export declare enum PricingType {
    PER_LESSON = "per_lesson",
    MONTHLY = "monthly"
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
    teachername: string;
    recurrenceType: LessonRecurrenceType;
    recurrencePattern: any;
    status: LessonStatus;
    createdAt: Date;
    updatedAt: Date;
    teacherId: string;
    teacher: Teacher;
    students: Student[];
    sectionId: string;
    section: Section;
    branch: Branch;
    attendances: LessonAttendance[];
    price: number;
    pricingType: PricingType;
    grade?: string;
    nameAr: any;
    branches: any;
}
