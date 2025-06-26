import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './create-teacher.dto';
import { UserRole } from '../user.role.enum';
import { UserService } from '../user.service';
import { UserPayload } from '../userPayload.type';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { AssistantService } from '../assistant/assistant.service';
export declare class TeacherController {
    private readonly teacherService;
    private readonly userService;
    private readonly assistantService;
    constructor(teacherService: TeacherService, userService: UserService, assistantService: AssistantService);
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
    getTeacherAssistants(id: string, user: UserPayload): Promise<{
        assistants: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            role: UserRole;
            createdAt: Date;
            teacherId: string;
        }[];
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
            teacherId: string;
        };
    }>;
}
