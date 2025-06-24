import { PaginatedRequestDto } from 'src/shared/dto/paginated-req.dto';
import { UserRole } from '../user.role.enum';
export declare class FilterUsersDto extends PaginatedRequestDto {
    email: string;
    city: string;
    country: string;
    verify: boolean;
    role: UserRole;
    dateOfBirth?: Date;
    phone?: string;
}
