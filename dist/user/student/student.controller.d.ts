import { StudentService } from './student.service';
import { CreateStudentDto } from './create-student.dto';
import { WhatsAppService } from '../../notification/whatsapp.service';
export declare class StudentController {
    private readonly studentService;
    private readonly whatsAppService;
    constructor(studentService: StudentService, whatsAppService: WhatsAppService);
    create(createStudentDto: CreateStudentDto): Promise<import("./student.entity").Student>;
    findAll(): Promise<{
        students: import("./student.entity").Student[];
    }>;
    findOne(id: string): Promise<{
        student: import("./student.entity").Student;
    }>;
    findByPhoneNumber(phoneNumber: string): Promise<{
        student: import("./student.entity").Student;
    }>;
    findByManualEntryId(manualEntryId: string): Promise<{
        student: import("./student.entity").Student;
    }>;
    update(id: string, updateStudentDto: Partial<CreateStudentDto>): Promise<import("./student.entity").Student>;
    remove(id: string): Promise<void>;
    getStudentTeachers(id: string): Promise<{
        teachers: any[];
    }>;
    getStudentLessons(id: string): Promise<{
        lessons: any[];
    }>;
    sendBarcodeToPhone(body: {
        phoneNumber: string;
        base64Image: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
