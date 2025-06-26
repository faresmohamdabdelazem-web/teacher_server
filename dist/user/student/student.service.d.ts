import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './create-student.dto';
export declare class StudentService {
    private studentRepository;
    constructor(studentRepository: Repository<Student>);
    create(createStudentDto: CreateStudentDto): Promise<Student>;
    findAll(): Promise<{
        students: Student[];
    }>;
    findOne(id: string): Promise<Student>;
    findByPhoneNumber(phoneNumber: string): Promise<Student | null>;
    findById(id: string): Promise<Student | null>;
    update(id: string, updateStudentDto: Partial<CreateStudentDto>): Promise<Student>;
    remove(id: string): Promise<void>;
    getStudentTeachers(id: string): Promise<{
        teachers: any[];
    }>;
    getStudentLessons(id: string): Promise<{
        lessons: any[];
    }>;
}
