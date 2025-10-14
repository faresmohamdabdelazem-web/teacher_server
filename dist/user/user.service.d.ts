import { CreateUserDto } from './dto/create-user.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPayload } from './userPayload.type';
import { FilterUsersDto } from './dto/filter-user.dto';
import { UserRole } from './user.role.enum';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TeacherService } from './teacher/teacher.service';
import { AssistantService } from './assistant/assistant.service';
export declare class UserService {
    private userRepository;
    private cloudinary;
    private teacherService;
    private assistantService;
    constructor(userRepository: Repository<User>, cloudinary: CloudinaryService, teacherService: TeacherService, assistantService: AssistantService);
    create(createUserDto: CreateUserDto): Promise<User>;
    private base64ToBuffer;
    findAll(paginatedRequestDto: FilterUsersDto): Promise<{
        users: User[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUserCount(): Promise<{
        count: number;
    }>;
    findOneByEmail(value: string): Promise<User>;
    findOneById(value: string): Promise<User>;
    isValidOtp(otp: string): Promise<User | null>;
    update(userId: string, updateUserDto: UpdateUserDto, signedUser?: UserPayload): Promise<{
        user: User;
    }>;
    findOne(userId: string): Promise<{
        user: {
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
            teacher: import("./teacher/teacher.entity").Teacher;
            role: UserRole;
            branch: import("../branch/entities/branch.entity").Branch;
            branchId: string;
        };
    }>;
    remove(userId: string): Promise<{
        message: string;
    }>;
    changePassword(changePassword: ChangePasswordDto, userId: string): Promise<{
        message: string;
    }>;
    createAdmin(): Promise<User>;
    createFakeUsers(): Promise<void>;
}
