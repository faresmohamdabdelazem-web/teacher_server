import { Teacher } from '../teacher/teacher.entity';
import { Lesson } from '../../lesson/entities/lesson.entity';
import { User } from '../entities/user.entity';
export declare class Student {
    id: string;
    user: User;
    parentPhoneNumber: string;
    createdAt: Date;
    updatedAt: Date;
    teachers: Teacher[];
    lessons: Lesson[];
}
