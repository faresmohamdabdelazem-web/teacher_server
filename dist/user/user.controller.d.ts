import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './user.role.enum';
import { UserPayload } from './userPayload.type';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { StudentService } from './student/student.service';
import { CreateStudentDto } from './student/create-student.dto';
import { TeacherService } from './teacher/teacher.service';
import { AssistantService } from './assistant/assistant.service';
export declare class UserController {
    private readonly userService;
    private readonly studentService;
    private readonly teacherService;
    private readonly assistantService;
    constructor(userService: UserService, studentService: StudentService, teacherService: TeacherService, assistantService: AssistantService);
    create(createUserDto: CreateUserDto): Promise<import("./entities/user.entity").User>;
    findAll(paginatedRequestDto: FilterUsersDto): Promise<{
        users: import("./entities/user.entity").User[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
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
    update(id: string, user: UserPayload, updateUserDto: UpdateUserDto): Promise<{
        user: import("./entities/user.entity").User;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    changePassword(changePasswordDto: ChangePasswordDto, user: UserPayload): Promise<{
        message: string;
    }>;
    createStudentByAssistant(createStudentData: CreateStudentDto, user: UserPayload): Promise<{
        message: string;
        student: {
            id: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
            parentPhoneNumber: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    createTeacherByAdmin(createTeacherData: CreateUserDto): Promise<{
        message: string;
        user: import("./entities/user.entity").User;
        teacher: import("./teacher/teacher.entity").Teacher;
    }>;
    createAssistantByAdmin(createAssistantData: CreateUserDto): Promise<{
        message: string;
        user: import("./entities/user.entity").User;
        assistant: import("./assistant").Assistant;
    }>;
}
