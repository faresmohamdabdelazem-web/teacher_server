import { User } from '../entities/user.entity';
import { Teacher } from '../teacher/teacher.entity';
export declare class Assistant {
    userId: string;
    user: User;
    teacherId: string;
    teacher: Teacher;
    createdAt: Date;
    updatedAt: Date;
}
