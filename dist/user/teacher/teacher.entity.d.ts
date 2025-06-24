import { Lesson } from '../../lesson/entities/lesson.entity';
import { Student } from '../student/student.entity';
import { User } from '../entities/user.entity';
export declare class Teacher {
    id: string;
    user: User;
    createdAt: Date;
    updatedAt: Date;
    lessons: Lesson[];
    students: Student[];
}
