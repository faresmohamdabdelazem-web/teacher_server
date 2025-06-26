import { Teacher } from '../teacher/teacher.entity';
import { Lesson } from '../../lesson/entities/lesson.entity';
export declare class Student {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    parentPhoneNumber?: string;
    grade?: string;
    createdAt: Date;
    updatedAt: Date;
    teachers: Teacher[];
    lessons: Lesson[];
    generateId(): void;
}
