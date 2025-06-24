import { Lesson } from './lesson.entity';
import { Student } from '../../user/student/student.entity';
export declare enum AttendanceStatus {
    PRESENT = "present",
    ABSENT = "absent",
    LATE = "late",
    EXCUSED = "excused"
}
export declare class LessonAttendance {
    id: string;
    lessonId: string;
    studentId: string;
    status: AttendanceStatus;
    attendanceTime: Date;
    notes: string;
    markedBy: string;
    createdAt: Date;
    updatedAt: Date;
    lesson: Lesson;
    student: Student;
}
