import { StudentService } from './student.service';
import { CreateStudentDto } from './create-student.dto';
export declare class StudentController {
    private readonly studentService;
    constructor(studentService: StudentService);
    create(createStudentDto: CreateStudentDto): Promise<import("./student.entity").Student>;
    findAll(): Promise<{
        students: import("./student.entity").Student[];
    }>;
    findOne(id: string): Promise<import("./student.entity").Student>;
    findByEmail(email: string): Promise<import("./student.entity").Student>;
    update(id: string, updateStudentDto: Partial<CreateStudentDto>): Promise<import("./student.entity").Student>;
    remove(id: string): Promise<void>;
    getStudentTeachers(id: string): Promise<{
        teachers: any[];
    }>;
    getStudentLessons(id: string): Promise<{
        lessons: any[];
    }>;
}
