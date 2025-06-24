import { CreateUserDto } from './dto/create-user.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPayload } from './userPayload.type';
import { FilterUsersDto } from './dto/filter-user.dto';
import { UserRole } from './user.role.enum';
import { ChangePasswordDto } from './dto/change-password.dto';
import { StripeService } from 'src/stripe/stripe.service';
import { TeacherService } from './teacher/teacher.service';
import { AssistantService } from './assistant/assistant.service';
export declare class UserService {
    private userRepository;
    private cloudinary;
    private stripeService;
    private teacherService;
    private assistantService;
    constructor(userRepository: Repository<User>, cloudinary: CloudinaryService, stripeService: StripeService, teacherService: TeacherService, assistantService: AssistantService);
    create(createUserDto: CreateUserDto): Promise<User>;
    private base64ToBuffer;
    private uploadPassportPhotoToStripe;
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
            role: UserRole;
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
