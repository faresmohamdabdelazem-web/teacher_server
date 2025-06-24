import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './create-teacher.dto';
import { UserRole } from '../user.role.enum';
import { UserService } from '../user.service';
import { UserPayload } from '../userPayload.type';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
export declare class TeacherController {
    private readonly teacherService;
    private readonly userService;
    constructor(teacherService: TeacherService, userService: UserService);
    create(createTeacherDto: CreateTeacherDto, user: UserPayload): Promise<import("./teacher.entity").Teacher>;
    findAll(): Promise<{
        teachers: User[];
    }>;
    findOne(id: string): Promise<import("./teacher.entity").Teacher>;
    getTeacherStudents(id: string): Promise<{
        students: import("../student/student.entity").Student[];
    }>;
    getTeacherLessons(id: string): Promise<{
        lessons: import("../../lesson/entities/lesson.entity").Lesson[];
    }>;
    update(id: string, updateTeacherDto: any): Promise<import("./teacher.entity").Teacher>;
    remove(id: string): Promise<void>;
    createAssistant(createAssistantData: CreateUserDto, user: UserPayload): Promise<{
        message: string;
        assistant: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            role: UserRole;
            phone: string;
            createdAt: Date;
        };
    }>;
}
