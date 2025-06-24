import { LessonRecurrenceType, LessonStatus } from '../entities/lesson.entity';
interface RecurrencePattern {
    dayOfWeek?: number;
}
export declare class CreateLessonDto {
    title: string;
    description?: string;
    subject: string;
    duration?: number;
    isActive?: boolean;
    scheduledDate?: string;
    startTime?: string;
    endTime?: string;
    room?: string;
    teacherId: string;
    recurrenceType?: LessonRecurrenceType;
    recurrencePattern?: RecurrencePattern;
    status?: LessonStatus;
}
export {};
