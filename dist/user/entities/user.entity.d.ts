import { Branch } from 'src/branch/entities/branch.entity';
import { UserRole } from '../user.role.enum';
import { Teacher } from '../teacher/teacher.entity';
export declare class User {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    password?: string;
    otpToken?: string;
    otpExp?: number;
    dateOfBirth?: Date;
    createdAt: Date;
    updatedAt: Date;
    teacher: Teacher;
    role: UserRole;
    branch: Branch;
    branchId: string;
}
