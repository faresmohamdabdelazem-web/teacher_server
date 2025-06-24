import { UserRole } from '../user.role.enum';
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
    role: UserRole;
}
