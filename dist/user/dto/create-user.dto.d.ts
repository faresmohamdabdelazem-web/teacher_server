import { UserRole } from '../user.role.enum';
export declare class CreateUserDto {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    role: UserRole;
    phone?: string;
}
