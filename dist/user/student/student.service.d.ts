import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './create-student.dto';
import { InstallmentService } from 'src/Installment/installment.service';
import { LessonAttendance } from 'src/lesson/entities/lesson-attendance.entity';
import { PayInstallmentDto } from 'src/Installment/dto/pay-installment.dto';
import { Installment } from 'src/Installment/entities/installment.entity';
import { Branch } from 'src/branch/entities/branch.entity';
import { Section } from 'src/section/entities/section.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Lesson } from 'src/lesson/entities/lesson.entity';
import { RevenueService } from 'src/revenues/revenue.service';
import { Assistant } from '../assistant/assistant.entity';
export declare class StudentService {
    private studentRepository;
    private installmentRepository;
    private branchRepository;
    private sectionRepository;
    private attendanceRepository;
    private assistantRepository;
    private installmentService;
    private readonly revenueService;
    constructor(studentRepository: Repository<Student>, installmentRepository: Repository<Installment>, branchRepository: Repository<Branch>, sectionRepository: Repository<Section>, attendanceRepository: Repository<LessonAttendance>, assistantRepository: Repository<Assistant>, installmentService: InstallmentService, revenueService: RevenueService);
    private recalculateStudentFinancials;
    create(createStudentDto: CreateStudentDto, user: any): Promise<Student>;
    payInstallment(studentId: string, dto: PayInstallmentDto): Promise<{
        message: string;
        student: Student;
    }>;
    logPresence(studentId: string, lessonName: string): Promise<Student>;
    logAbsence(studentId: string, lessonName: string): Promise<Student>;
    findAll(branchId?: string, sectionId?: string, isLate?: string, phoneNumber?: string, name?: string, user?: any): Promise<{
        students: Student[];
    }>;
    findAllName(user?: any): Promise<{
        students: {
            id: string;
            firstName: string;
            lastName: string;
        }[];
    }>;
    findOne(id: string): Promise<Student>;
    findByPhoneNumber(phoneNumber: string): Promise<Student>;
    findByManualEntryId(manualEntryId: string): Promise<Student>;
    update(id: string, updateStudentDto: Partial<CreateStudentDto>): Promise<Student>;
    remove(id: string): Promise<void>;
    getStudentTeachers(id: string): Promise<Teacher[]>;
    getStudentLessons(id: string): Promise<Lesson[]>;
}
