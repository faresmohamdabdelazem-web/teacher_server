import { StudentService } from './student.service';
import { CreateStudentDto } from './create-student.dto';
import { WhatsAppService } from '../../notification/whatsapp.service';
import { PayInstallmentDto } from 'src/Installment/dto/pay-installment.dto';
export declare class StudentController {
    private readonly studentService;
    private readonly whatsAppService;
    constructor(studentService: StudentService, whatsAppService: WhatsAppService);
    create(createStudentDto: CreateStudentDto, user: any): Promise<import("./student.entity").Student>;
    payInstallment(id: string, payInstallmentDto: PayInstallmentDto): Promise<{
        message: string;
        student: import("./student.entity").Student;
    }>;
    findAll(user: any, branchId?: string, sectionId?: string, phoneNumber?: string, name?: string, isLate?: string): Promise<{
        students: import("./student.entity").Student[];
    }>;
    findAllName(user: any): Promise<{
        students: {
            id: string;
            firstName: string;
            lastName: string;
        }[];
    }>;
    findOne(id: string): Promise<import("./student.entity").Student>;
    findByPhoneNumber(phoneNumber: string): Promise<import("./student.entity").Student>;
    findByManualEntryId(manualEntryId: string): Promise<import("./student.entity").Student>;
    update(id: string, updateStudentDto: Partial<CreateStudentDto>): Promise<import("./student.entity").Student>;
    remove(id: string): Promise<void>;
    getStudentTeachers(id: string): Promise<import("../teacher/teacher.entity").Teacher[]>;
    getStudentLessons(id: string): Promise<import("../../lesson/entities/lesson.entity").Lesson[]>;
    sendBarcodeToPhone(body: {
        phoneNumber: string;
        base64Image: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
