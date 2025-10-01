import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './create-student.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { InstallmentService } from 'src/Installment/installment.service';
export declare class StudentService {
    private studentRepository;
    private cloudinary;
    private installmentPay;
    constructor(studentRepository: Repository<Student>, cloudinary: CloudinaryService, installmentPay: InstallmentService);
    create(createStudentDto: CreateStudentDto): Promise<Student>;
    findAll(): Promise<{
        students: Student[];
    }>;
    findOne(id: string): Promise<Student>;
    findByPhoneNumber(phoneNumber: string): Promise<{
        student: Student;
    }>;
    findById(id: string): Promise<{
        student: Student;
    }>;
    update(id: string, updateStudentDto: Partial<CreateStudentDto>): Promise<Student>;
    remove(id: string): Promise<void>;
    getStudentTeachers(id: string): Promise<{
        teachers: any[];
    }>;
    getStudentLessons(id: string): Promise<{
        lessons: any[];
    }>;
    findByManualEntryId(manualEntryId: string): Promise<{
        student: Student;
    }>;
}
