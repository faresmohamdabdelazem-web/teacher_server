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
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PROFILE_PHOTO_FILE } from 'src/hatly.constants';
import { InstallmentService } from 'src/Installment/installment.service';
import { PayInstallmentDto } from 'src/Installment/dto/pay-installment.dto';
import { Installment } from 'src/Installment/entities/installment.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Lesson } from 'src/lesson/entities/lesson.entity';
import { Branch } from 'src/branch/entities/branch.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Installment)
    private installmentRepository: Repository<Installment>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    private cloudinary: CloudinaryService,
    private installmentService: InstallmentService,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const { branchId, nationalId, section, phoneNumber } = createStudentDto;

    if (phoneNumber) {
      const existingStudentByPhone = await this.studentRepository.findOneBy({
        phoneNumber: phoneNumber,
      });
      if (existingStudentByPhone) {
        throw new ConflictException(
          'Student with this phone number already exists',
        );
      }
    }

    const branch = await this.branchRepository.findOneBy({ id: branchId });
    if (!branch) {
      throw new BadRequestException(`Branch with ID "${branchId}" not found`);
    }

    const branchInitial = branch.name.charAt(0).toUpperCase();
    const sectionInitial = section.charAt(0).toUpperCase();
    const nationalIdSuffix = nationalId.slice(-6);
    const generatedId = `${branchInitial}${sectionInitial}-${nationalIdSuffix}`;

    const existingStudentById = await this.studentRepository.findOneBy({
      id: generatedId,
    });
    if (existingStudentById) {
      throw new ConflictException(
        `A student with the generated ID "${generatedId}" already exists. This may indicate a duplicate national ID.`,
      );
    }

    const totalAmount = createStudentDto.totalAmount || 0;
    const downPayment = createStudentDto.downPayment || 0;
    const remainingDownPayment = createStudentDto.remainingDownPayment || 0;

    if (totalAmount <= downPayment) {
      throw new BadRequestException(
        'Total amount must be greater than down payment',
      );
    }

    const actualPaidOnCreate = downPayment - remainingDownPayment;

    const studentData = {
      ...createStudentDto,
      id: generatedId,
      branch: branch,
      paidAmount: actualPaidOnCreate,
      remainingBalance: totalAmount - actualPaidOnCreate,
      installmentStage: 0,
    };
    delete studentData.branchId;

    const student = this.studentRepository.create(studentData);
    const savedStudent = await this.studentRepository.save(student);

    if (
      savedStudent.remainingDownPayment &&
      savedStudent.remainingDownPayment > 0
    ) {
      await this.installmentService.createInitialInstallment(savedStudent);
    } else {
      await this.installmentService.createMonthlyInstallments(savedStudent);
      savedStudent.installmentStage = 1;
      await this.studentRepository.save(savedStudent);
    }

    return this.findOne(savedStudent.id);
  }

  async payInstallment(
    studentId: string,
    dto: PayInstallmentDto,
  ): Promise<Student> {
    const student = await this.studentRepository.findOneBy({ id: studentId });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const currentInstallment = await this.installmentRepository.findOne({
      where: {
        studentId: student.id,
        installmentNumber: student.installmentStage,
      },
    });

    if (!currentInstallment) {
      throw new NotFoundException(
        'No active installment found for the current stage',
      );
    }

    if (dto.amount > currentInstallment.remainingAmount) {
      throw new BadRequestException(
        'القيمة المالية اكبر من القيمة المستحقة ',
      );
    }

    currentInstallment.amountPaid += dto.amount;
    currentInstallment.remainingAmount -= dto.amount;
    currentInstallment.paymentHistory.push({
      amount: dto.amount,
      paidAt: new Date(),
      cashReceiver: dto.cashReceiver,
    });

    student.paidAmount += dto.amount;
    student.remainingBalance -= dto.amount;

    await this.installmentRepository.save(currentInstallment);

    if (currentInstallment.remainingAmount <= 0) {
      const wasInitialPaymentStage = student.installmentStage === 0;
      student.installmentStage += 1;

      if (wasInitialPaymentStage) {
        await this.installmentService.createMonthlyInstallments(student);
      }
    }

    await this.studentRepository.save(student);
    return this.findOne(student.id);
  }

  async findAll(): Promise<{ students: Student[] }> {
    const students = await this.studentRepository.find({
      relations: ['teachers', 'lessons', 'installments', 'branch'],
    });
    return { students };
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['teachers', 'lessons', 'installments', 'branch'],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { phoneNumber },
      relations: ['teachers', 'lessons', 'branch'],
    });
    if (!student) {
      throw new NotFoundException('Student not found with this phone number');
    }
    return student;
  }

  async findByManualEntryId(manualEntryId: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { manualEntryId },
      relations: ['teachers', 'lessons', 'branch'],
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