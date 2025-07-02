import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './create-student.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
export declare class StudentService {
    private studentRepository;
    private cloudinary;
    constructor(studentRepository: Repository<Student>, cloudinary: CloudinaryService);
    create(createStudentDto: CreateStudentDto): Promise<Student>;
    findAll(): Promise<{
        students: Student[];
    }>;
    findOne(id: string): Promise<{
        student: Student;
    }>;
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
