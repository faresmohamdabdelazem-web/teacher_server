import { User } from '../entities/user.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Branch } from 'src/branch/entities/branch.entity';
export declare class Assistant {
    userId: string;
    user: User;
    teacherId: string;
    teacher: Teacher;
    branchId: string;
    branch: Branch;
    createdAt: Date;
    updatedAt: Date;
}
