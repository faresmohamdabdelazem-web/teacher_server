import { UserRole } from 'src/user/user.role.enum';
export declare class RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
}
