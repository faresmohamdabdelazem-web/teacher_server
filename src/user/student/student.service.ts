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
import { PayInstallmentDto, PaymentType } from 'src/Installment/dto/pay-installment.dto';
import { Installment, InstallmentStatus } from 'src/Installment/entities/installment.entity';
import { Branch } from 'src/branch/entities/branch.entity';
import { Section } from 'src/section/entities/section.entity';
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
    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,
    private installmentService: InstallmentService,
  ) { }

  private recalculateStudentFinancials(student: Student): Student {
    if (!student.installments) {
      return student;
    }

    const downPaymentInstallment = student.installments.find(
      inst => inst.installmentNumber === 0,
    );

    student.remainingDownPayment = downPaymentInstallment
      ? downPaymentInstallment.remainingAmount
      : 0;

    student.remainingBalance = student.totalAmount - student.paidAmount;

    const currentDate = new Date();
    const requiredInstallment = student.installments.find(inst => {
      return inst.dueDate < currentDate && inst.status !== InstallmentStatus.PAID;
    });
    student.isLate = !!requiredInstallment;

    return student;
  }

 async create(createStudentDto: CreateStudentDto): Promise<Student> {
  const { branchId, sectionId, phoneNumber } = createStudentDto;

  if (phoneNumber) {
    const existingStudentByPhone = await this.studentRepository.findOneBy({ phoneNumber });
    if (existingStudentByPhone) {
      throw new ConflictException('Student with this phone number already exists');
    }
  }

  const branch = await this.branchRepository.findOne({
    where: { id: branchId },
    relations: ['sections'],
  });
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

  // 🆔 إنشاء رقم ID جديد للطالب
  const lastStudent = await this.studentRepository.findOne({
    where: {},
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
  const sectionInitial = section.name.charAt(0).toUpperCase();
  const generatedId = `${branchInitial}${sectionInitial}-${paddedSequence}`;

  const existingStudentById = await this.studentRepository.findOneBy({ id: generatedId });
  if (existingStudentById) {
    throw new ConflictException(`A student with the generated ID "${generatedId}" already exists. Please try again.`);
  }

  // 💰 الحسابات المالية الأساسية
  const totalAmount = createStudentDto.totalAmount;
  const downPayment = createStudentDto.downPayment;
  const remainingDownPayment = createStudentDto.remainingDownPayment ?? 0;
  const paidDownPayment = downPayment - remainingDownPayment;

  if (paidDownPayment > downPayment) {
    throw new BadRequestException('Paid down payment cannot be greater than the required down payment');
  }

  const paidAmount = paidDownPayment;

  // 📦 إنشاء كائن الطالب
  const studentData = {
    ...createStudentDto,
    id: generatedId,
    branch,
    section,
    totalAmount,
    downPayment,
    remainingDownPayment,
    paidAmount,
    remainingBalance: totalAmount - paidAmount,
    installmentStage: 0,
    paymentHistory: [], // 🧾 نضيفها هنا
  };

  delete studentData.branchId;
  delete studentData.sectionId;

  const student = this.studentRepository.create(studentData);
  const savedStudent = await this.studentRepository.save(student);

  //  لو دفع جزء من المقدم نحفظه في سجل الدفع
  if (paidDownPayment > 0) {
    savedStudent.paymentHistory.push({
      amount: paidDownPayment,
      paidAt: new Date(),
      cashReceiver: savedStudent.cashReceiver || 'Admin',
      receiptNumber: `DP-${Date.now()}`,
      installmentNumber: 0,
      paymentType: PaymentType.DOWN_PAYMENT,
      throughPerson:savedStudent.throughPerson || "user"
    });

    await this.studentRepository.save(savedStudent);
  }

  //  إنشاء الأقساط المناسبة
  if (savedStudent.remainingDownPayment > 0) {
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
): Promise<{ message: string; student: Student }> {
  const student = await this.studentRepository.findOne({
    where: { id: studentId },
    relations: ['installments'],
  });

  if (!student) {
    throw new NotFoundException('Student not found');
  }

  // 🔍 تحديد أول قسط عليه دور (ما زال غير مدفوع بالكامل)
  const nextDueInstallment = student.installments.find(
    (inst) => inst.remainingAmount > 0,
  );

  // ✅ في حالة اختيار "دفعة مقدمة" بعد سداد كل الأقساط
  if (!nextDueInstallment && dto.paymentType === PaymentType.DOWN_PAYMENT) {
    throw new BadRequestException(
      `✅ لقد انتهيت من جميع الأقساط بالفعل. لا يمكنك دفع دفعة مقدمة بعد الآن. 
يرجى اختيار "جزء من القسط" أو "دفع كامل القسط" إذا كان هناك قسط جديد.`,
    );
  }

  if (!nextDueInstallment) {
    throw new BadRequestException('جميع الأقساط تم سدادها بالكامل!');
  }

  // 🗓️ خريطة الشهور
  const months = [
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
  ];
  const nextMonthIndex = (nextDueInstallment.installmentNumber - 1) % 12;
  const nextMonthName = months[nextMonthIndex];

  // ✅ التأكد إن المستخدم بيدفع القسط اللي عليه الدور فعلاً
  if (dto.installmentNumber !== nextDueInstallment.installmentNumber) {
    throw new BadRequestException(
      `لا يمكنك دفع هذا القسط الآن. القسط المستحق الحالي هو ر (${nextMonthName}) بمبلغ ${nextDueInstallment.remainingAmount} جنيه.`,
    );
  }

  const targetInstallment = nextDueInstallment;

  if (targetInstallment.status === InstallmentStatus.PAID) {
    throw new BadRequestException('✅ هذا القسط تم سداده بالكامل بالفعل.');
  }

  // ⚠️ تحقق من نوع الدفع: لو اختار FULL_INSTALLMENT والمبلغ أقل من المستحق
  if (
    dto.paymentType === PaymentType.FULL &&
    dto.amount < targetInstallment.remainingAmount
  ) {
    throw new BadRequestException(
      ` المبلغ المدخل (${dto.amount} جنيه) لا يغطي القسط بالكامل (${targetInstallment.remainingAmount} جنيه). 
يرجى اختيار نوع الدفع "جزء من القسط" بدلاً من "دفع كامل القسط".`,
    );
  }

  if (dto.amount > targetInstallment.remainingAmount) {
    throw new BadRequestException(
      `⚠️ المبلغ المدفوع أكبر من المبلغ المستحق (${targetInstallment.remainingAmount} جنيه).`,
    );
  }

  // ✅ التحديثات المالية
  targetInstallment.amountPaid += dto.amount;
  targetInstallment.remainingAmount -= dto.amount;

  student.paidAmount += dto.amount;
  student.remainingBalance -= dto.amount;

  // 💰 إضافة بيانات الدفع في سجل الطالب
  student.paymentHistory.push({
    amount: dto.amount,
    paidAt: new Date(),
    cashReceiver: dto.cashReceiver,
    receiptNumber: dto.receiptNumber,
    installmentNumber: dto.installmentNumber,
    paymentType: dto.paymentType,
    throughPerson:dto.throughPerson
  });

  // ✅ حفظ القسط
  await this.installmentRepository.save(targetInstallment);

  let message = `تم دفع ${dto.amount} جنيه بنجاح من القسط رقم ${dto.installmentNumber}.`;

  // 🔄 لو القسط دا أول قسط وتم سداده بالكامل → أنشئ الأقساط الشهرية
  if (targetInstallment.remainingAmount <= 0) {
    if (targetInstallment.installmentNumber === 0) {
      await this.installmentService.createMonthlyInstallments(student);
      student.installmentStage = 1;
      message =
        'تم سداد الدفعة المقدمة بالكامل! تم إنشاء الأقساط الشهرية بنجاح.';
    } else {
      message = `تم سداد القسط رقم ${targetInstallment.installmentNumber} بالكامل. شكرًا على التزامك!`;
    }
  }

  await this.studentRepository.save(student);

  return {
    message,
    student: await this.findOne(student.id),
  };
}






  async findAll(): Promise<{ students: Student[] }> {
    const students = await this.studentRepository.find({
      relations: ['teachers', 'lessons', 'installments', 'branch', 'section'],
    });

    const studentsWithRecalculatedData = students.map(student =>
      this.recalculateStudentFinancials(student)
    );

    return { students: studentsWithRecalculatedData };
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['teachers', 'lessons', 'installments', 'branch', 'section'],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.recalculateStudentFinancials(student);
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { phoneNumber },
      relations: ['teachers', 'lessons', 'branch', 'section', 'installments'],
    });
    if (!student) {
      throw new NotFoundException('Student not found with this phone number');
    }
    return this.recalculateStudentFinancials(student);
  }

  async findByManualEntryId(manualEntryId: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { manualEntryId },
      relations: ['teachers', 'lessons', 'branch', 'section', 'installments'],
    });
    if (!student) {
      throw new NotFoundException('Student not found with this manual ID');
    }
    return this.recalculateStudentFinancials(student);
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