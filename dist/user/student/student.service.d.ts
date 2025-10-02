import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './create-student.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { InstallmentService } from 'src/Installment/installment.service';
import { PayInstallmentDto } from 'src/Installment/dto/pay-installment.dto';
import { Installment } from 'src/Installment/entities/installment.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Lesson } from 'src/lesson/entities/lesson.entity';
import { Branch } from 'src/branch/entities/branch.entity';
export declare class StudentService {
    private studentRepository;
    private installmentRepository;
    private branchRepository;
    private cloudinary;
    private installmentService;
    constructor(studentRepository: Repository<Student>, installmentRepository: Repository<Installment>, branchRepository: Repository<Branch>, cloudinary: CloudinaryService, installmentService: InstallmentService);
    create(createStudentDto: CreateStudentDto): Promise<Student>;
    payInstallment(studentId: string, dto: PayInstallmentDto): Promise<Student>;
    findAll(): Promise<{
        students: Student[];
    }>;
    findOne(id: string): Promise<Student>;
    findByPhoneNumber(phoneNumber: string): Promise<Student>;
    findByManualEntryId(manualEntryId: string): Promise<Student>;
    update(id: string, updateStudentDto: Partial<CreateStudentDto>): Promise<Student>;
    remove(id: string): Promise<void>;
    getStudentTeachers(id: string): Promise<Teacher[]>;
    getStudentLessons(id: string): Promise<Lesson[]>;
}
