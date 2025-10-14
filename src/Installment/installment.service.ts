import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Installment } from './entities/installment.entity';
import { Student } from 'src/user/student/student.entity';

@Injectable()
export class InstallmentService {
  constructor(
    @InjectRepository(Installment)
    private installmentRepository: Repository<Installment>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async createInitialInstallment(student: Student): Promise<Installment> {
    const installment = this.installmentRepository.create({
      studentId: student.id,
      installmentNumber: 0,
      installmentStage: 0,
      amount: student.remainingDownPayment,
      monthNumber: 0,
      cashReceiver: student.cashReceiver || 'Admin',
    });
    return this.installmentRepository.save(installment);
  }

async createMonthlyInstallments(student: Student): Promise<Installment[]> {
  if (!student.id) {
    throw new BadRequestException('Student must be saved before creating installments');
  }

  const amountToBeInstalled = student.totalAmount - student.downPayment;
  const rawMonthlyAmount = amountToBeInstalled / 12;

  const decimalPart = rawMonthlyAmount % 1;
  const monthlyAmount = decimalPart < 0.4
    ? Math.floor(rawMonthlyAmount)
    : Math.ceil(rawMonthlyAmount);

  const installments: Installment[] = [];

  for (let i = 1; i <= 12; i++) {
    const installment = this.installmentRepository.create({
      studentId: student.id, 
      installmentNumber: i,
      installmentStage: i,
      amount: monthlyAmount,
      monthNumber: i,
      cashReceiver: student.cashReceiver || 'Admin',
      throughPerson:student.throughPerson || 'User'
    });

    installments.push(installment);
  }

  return this.installmentRepository.save(installments);
}


  async findAll(): Promise<Installment[]> {
    return this.installmentRepository.find({ relations: ['student'] });
  }

  async findByStudent(studentId: string): Promise<Installment[]> {
    const student = await this.studentRepository.findOneBy({ id: studentId });
    if (!student) {
      throw new NotFoundException('هذا الطالب غير موجود');
    }
    return this.installmentRepository.find({
      where: { studentId },
      relations: ['student'],
      order: { installmentNumber: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Installment> {
    return this.installmentRepository.findOne({
      where: { id },
      relations: ['student'],
    });
  }
}