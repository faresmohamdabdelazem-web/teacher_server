import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './create-student.dto';
import { InstallmentService } from 'src/Installment/installment.service';
import { PayInstallmentDto } from 'src/Installment/dto/pay-installment.dto';
import { Installment, InstallmentStatus } from 'src/Installment/entities/installment.entity';
import { Branch } from 'src/branch/entities/branch.entity';
import { Section } from 'src/section/entities/section.entity'; // --- إضافة جديدة ---
import { Teacher } from '../teacher/teacher.entity';
import { Lesson } from 'src/lesson/entities/lesson.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Installment)
    private installmentRepository: Repository<Installment>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(Section) // --- إضافة جديدة ---
    private sectionRepository: Repository<Section>,
    private installmentService: InstallmentService,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const { branchId, sectionId, phoneNumber, nationalId } = createStudentDto;

    if (phoneNumber) {
      const existingStudentByPhone = await this.studentRepository.findOneBy({ phoneNumber });
      if (existingStudentByPhone) {
        throw new ConflictException('Student with this phone number already exists');
      }
    }

    const branch = await this.branchRepository.findOne({ where: { id: branchId }, relations: ['sections'] });
    if (!branch) {
      throw new BadRequestException(`Branch with ID "${branchId}" not found`);
    }

    const section = await this.sectionRepository.findOneBy({ id: sectionId });
    if (!section) {
      throw new BadRequestException(`Section with ID "${sectionId}" not found`);
    }

    const isSectionInBranch = branch.sections.some(s => s.id === section.id);
    if (!isSectionInBranch) {
      throw new BadRequestException(`Section "${section.name}" is not available in branch "${branch.name}"`);
    }
    
    const lastStudent = await this.studentRepository.findOne({
  where: {}, // لازم تحط where حتى لو فاضي
  order: { createdAt: 'DESC' },
});
    let newSequenceNumber = 1;
    if (lastStudent && lastStudent.id.includes('-')) {
      const lastIdParts = lastStudent.id.split('-');
      const lastNumber = parseInt(lastIdParts[lastIdParts.length - 1], 10);
      if (!isNaN(lastNumber)) {
        newSequenceNumber = lastNumber + 1;
      }
    }

    const paddedSequence = newSequenceNumber.toString().padStart(6, '0');
    const branchInitial = branch.name.charAt(0).toUpperCase();
    const sectionInitial = section.name.charAt(0).toUpperCase(); // --- تعديل: استخدام اسم القسم الفعلي ---
    const generatedId = `${branchInitial}${sectionInitial}-${paddedSequence}`;
    
    const existingStudentById = await this.studentRepository.findOneBy({ id: generatedId });
    if (existingStudentById) {
      throw new ConflictException(`A student with the generated ID "${generatedId}" already exists. Please try again.`);
    }

    const totalAmount = section.totalAmount;
    const downPayment = section.downPayment;
    const paidDownPayment = createStudentDto.paidDownPayment || 0;

    if (paidDownPayment > downPayment) {
      throw new BadRequestException('Paid down payment cannot be greater than the required down payment');
    }

    const remainingDownPayment = downPayment - paidDownPayment;
    const paidAmount = paidDownPayment;

    const studentData = {
      ...createStudentDto,
      id: generatedId,
      branch: branch,
      section: section,
      totalAmount: totalAmount,
      downPayment: downPayment,
      remainingDownPayment: remainingDownPayment,
      paidAmount: paidAmount,
      remainingBalance: totalAmount - paidAmount,
      installmentStage: 0,
    };
    
    delete studentData.branchId;
    delete studentData.sectionId;
    delete studentData.paidDownPayment;

    const student = this.studentRepository.create(studentData);
    const savedStudent = await this.studentRepository.save(student);

    if (savedStudent.remainingDownPayment > 0) {
      await this.installmentService.createInitialInstallment(savedStudent);
    } else {
      await this.installmentService.createMonthlyInstallments(savedStudent);
      savedStudent.installmentStage = 1;
      await this.studentRepository.save(savedStudent);
    }

    return this.findOne(savedStudent.id);
  }
  
    // ... (باقي الدوال payInstallment, findAll, etc. تبقى كما هي)
    async payInstallment(
    studentId: string,
    dto: PayInstallmentDto,
  ): Promise<Student> {
    const student = await this.studentRepository.findOneBy({ id: studentId });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const targetInstallment = await this.installmentRepository.findOne({
      where: {
        studentId: student.id,
        installmentNumber: dto.installmentNumber,
      },
    });

    if (!targetInstallment) {
      throw new NotFoundException(
        'The specified installment does not exist for this student',
      );
    }

    if (targetInstallment.status === InstallmentStatus.PAID) {
      throw new BadRequestException('This installment is already fully paid');
    }

    if (dto.amount > targetInstallment.remainingAmount) {
      throw new BadRequestException(
        'القيمة المالية اكبر من القيمة المستحقة ',
      );
    }

    targetInstallment.amountPaid += dto.amount;
    targetInstallment.remainingAmount -= dto.amount;
    targetInstallment.paymentHistory.push({
      amount: dto.amount,
      paidAt: new Date(),
      cashReceiver: dto.cashReceiver,
      receiptNumber: dto.receiptNumber,
    });

    student.paidAmount += dto.amount;
    student.remainingBalance -= dto.amount;

    await this.installmentRepository.save(targetInstallment);

    if (targetInstallment.remainingAmount <= 0) {
      if (targetInstallment.installmentNumber === 0) {
        await this.installmentService.createMonthlyInstallments(student);
        student.installmentStage = 1;
      }
    }

    await this.studentRepository.save(student);
    return this.findOne(student.id);
  }

  async findAll(): Promise<{ students: Student[] }> {
    const students = await this.studentRepository.find({
      relations: ['teachers', 'lessons', 'installments', 'branch', 'section'],
    });
    return { students };
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['teachers', 'lessons', 'installments', 'branch', 'section'],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { phoneNumber },
      relations: ['teachers', 'lessons', 'branch', 'section'],
    });
    if (!student) {
      throw new NotFoundException('Student not found with this phone number');
    }
    return student;
  }

  async findByManualEntryId(manualEntryId: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { manualEntryId },
      relations: ['teachers', 'lessons', 'branch', 'section'],
    });
    if (!student) {
      throw new NotFoundException('Student not found with this manual ID');
    }
    return student;
  }

  async update(
    id: string,
    updateStudentDto: Partial<CreateStudentDto>,
  ): Promise<Student> {
    const student = await this.findOne(id);
    Object.assign(student, updateStudentDto);
    await this.studentRepository.save(student);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentRepository.remove(student);
  }

  async getStudentTeachers(id: string): Promise<Teacher[]> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['teachers'],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student.teachers;
  }

  async getStudentLessons(id: string): Promise<Lesson[]> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['lessons'],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student.lessons;
  }
}