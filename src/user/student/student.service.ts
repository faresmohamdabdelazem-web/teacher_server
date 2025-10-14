import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { AttendanceStatus } from 'src/lesson/entities/lesson-attendance.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './create-student.dto';
import { InstallmentService } from 'src/Installment/installment.service';
import { LessonAttendance } from 'src/lesson/entities/lesson-attendance.entity';
import {
  PayInstallmentDto,
  PaymentType,
} from 'src/Installment/dto/pay-installment.dto';
import {
  Installment,
  InstallmentStatus,
} from 'src/Installment/entities/installment.entity';
import { Branch } from 'src/branch/entities/branch.entity';
import { Section } from 'src/section/entities/section.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Lesson } from 'src/lesson/entities/lesson.entity';
import { RevenueService } from 'src/revenues/revenue.service';
import { RevenueSource } from 'src/revenues/entities/revenues.entity';
import { UserRole } from '../user.role.enum';
import { UserPayload } from '../userPayload.type';

import  {Assistant} from '../assistant/assistant.entity'
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
    @InjectRepository(LessonAttendance)
    private attendanceRepository: Repository<LessonAttendance>,
 

   @InjectRepository(Assistant)
    private assistantRepository: Repository<Assistant>,
    private installmentService: InstallmentService,
    private readonly revenueService: RevenueService,
  ) {}

  private recalculateStudentFinancials(student: Student): Student {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    student.isLate = false;

    if (student.installments && student.installments.length > 0) {
      for (const installment of student.installments) {
        if (installment.dueDate) {
          const dueDate = new Date(installment.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          if (dueDate < today && installment.remainingAmount > 0) {
            student.isLate = true;
            break;
          }
        }
      }
    }

    return student;
  }

async create(createStudentDto: CreateStudentDto, user: any): Promise<Student> {
  const { branchId, sectionId, phoneNumber, firstName, lastName } = createStudentDto;

  // ✅ لو المستخدم Assistant اتحقق من الفرع
  if (user.role === UserRole.ASSISTANT) {
    const assistant = await this.assistantRepository.findOne({
      where: { user: { userId: user.id } },
      relations: ['branch'],
    });

    if (!assistant) {
      throw new ForbiddenException('Assistant not found');
    }

    if (assistant.branch.id !== branchId) {
      throw new ForbiddenException('الطلب ليس من نفس فرع المساعد');
    }
  }

  // ✅ تحقق من رقم الهاتف
  if (phoneNumber) {
    const existingStudentByPhone = await this.studentRepository.findOneBy({ phoneNumber });
    if (existingStudentByPhone) {
      throw new ConflictException('Student with this phone number already exists');
    }
  }

  // ✅ تحقق من الاسم
  const existingStudentByName = await this.studentRepository.findOne({
    where: { firstName, lastName },
  });
  if (existingStudentByName) {
    throw new ConflictException(`A student with the name "${firstName} ${lastName}" already exists`);
  }

  // ✅ تحقق من الفرع
  const branch = await this.branchRepository.findOne({
    where: { id: branchId },
    relations: ['sections'],
  });
  if (!branch) {
    throw new BadRequestException(`Branch with ID "${branchId}" not found`);
  }

  // ✅ تحقق من القسم
  const section = await this.sectionRepository.findOneBy({ id: sectionId });
  if (!section) {
    throw new BadRequestException(`Section with ID "${sectionId}" not found`);
  }

  // ✅ تحقق إن القسم فعلاً داخل الفرع
  const isSectionInBranch = branch.sections.some((s) => s.id === section.id);
  if (!isSectionInBranch) {
    throw new BadRequestException(
      `Section "${section.name}" is not available in branch "${branch.name}"`,
    );
  }

  // ✅ إنشاء ID جديد
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
    throw new ConflictException(
      `A student with the generated ID "${generatedId}" already exists. Please try again.`,
    );
  }

  const totalAmount = createStudentDto.totalAmount;
  const downPayment = createStudentDto.downPayment;
  const remainingDownPayment = createStudentDto.remainingDownPayment ?? 0;
  const paidDownPayment = downPayment - remainingDownPayment;

  if (paidDownPayment > downPayment) {
    throw new BadRequestException('Paid down payment cannot be greater than the required down payment');
  }

  const paidAmount = paidDownPayment;

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
    paymentHistory: [],
    activities: [],
  };

  delete studentData.branchId;
  delete studentData.sectionId;

  const student = this.studentRepository.create(studentData);

  student.activities.push({
    title: 'تم إنشاء حساب الطالب',
    subTitle: `تم تسجيل الطالب ${student.firstName} ${student.lastName} بنجاح.`,
    createdAt: new Date(),
  });

  const savedStudent = await this.studentRepository.save(student);

  // ✅ حفظ الدفعة المقدمة إن وجدت
  if (paidDownPayment > 0) {
    savedStudent.paymentHistory.push({
      amount: paidDownPayment,
      paidAt: new Date(),
      cashReceiver: savedStudent.cashReceiver || user.name || 'Admin',
      receiptNumber: `DP-${Date.now()}`,
      installmentNumber: 0,
      paymentType: PaymentType.DOWN_PAYMENT,
      throughPerson: savedStudent.throughPerson || user.name || 'user',
    });

    savedStudent.activities.push({
      title: 'تم دفع دفعة مقدمة',
      subTitle: `تم استلام مبلغ ${paidDownPayment} جنيه كدفعة مقدمة.`,
      createdAt: new Date(),
    });

    await this.revenueService.create({
      amount: paidDownPayment,
      source: RevenueSource.DOWN_PAYMENT,
      studentId: savedStudent.id,
      sectionId: savedStudent.section.id,
      branchId: savedStudent.branch.id,
    });

    await this.studentRepository.save(savedStudent);
  }

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
      relations: ['installments', 'section', 'branch'],
    });

    if (!student) {
      throw new NotFoundException('هذا الطالب غير موجود');
    }

    const nextDueInstallment = student.installments.find(
      (inst) => inst.remainingAmount > 0,
    );

    if (!nextDueInstallment && dto.paymentType === PaymentType.DOWN_PAYMENT) {
      throw new BadRequestException(
        `✅ لقد انتهيت من جميع الأقساط بالفعل. لا يمكنك دفع دفعة مقدمة بعد الآن. 
يرجى اختيار "جزء من القسط" أو "دفع كامل القسط" إذا كان هناك قسط جديد.`,
      );
    }

    if (!nextDueInstallment) {
      throw new BadRequestException('جميع الأقساط تم سدادها بالكامل!');
    }

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

    if (dto.installmentNumber !== nextDueInstallment.installmentNumber) {
      throw new BadRequestException(
        `لا يمكنك دفع هذا القسط الآن. القسط المستحق الحالي هو شهر (${nextMonthName}) بمبلغ ${nextDueInstallment.remainingAmount} جنيه.`,
      );
    }

    const targetInstallment = nextDueInstallment;

    if (targetInstallment.status === InstallmentStatus.PAID) {
      throw new BadRequestException('✅ هذا القسط تم سداده بالكامل بالفعل.');
    }

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
    if (!student.section || !student.branch) {
      throw new BadRequestException(
        `Data integrity error: Student with ID "${studentId}" does not have a section or branch assigned. Cannot process payment.`,
      );
    }
    targetInstallment.amountPaid += dto.amount;
    targetInstallment.remainingAmount -= dto.amount;

    student.paidAmount += dto.amount;
    student.remainingBalance -= dto.amount;

    student.paymentHistory.push({
      amount: dto.amount,
      paidAt: new Date(),
      cashReceiver: dto.cashReceiver,
      receiptNumber: dto.receiptNumber,
      installmentNumber: dto.installmentNumber,
      paymentType: dto.paymentType,
      throughPerson: dto.throughPerson,
    });

    const activityTitle =
      targetInstallment.installmentNumber === 0
        ? 'تم دفع جزء من الدفعة المقدمة'
        : 'تم دفع قسط';
    const activitySubTitle =
      targetInstallment.installmentNumber === 0
        ? `تم دفع مبلغ ${dto.amount} جنيه.`
        : `تم دفع مبلغ ${dto.amount} جنيه للقسط رقم ${dto.installmentNumber}.`;

    student.activities.push({
      title: activityTitle,
      subTitle: activitySubTitle,
      createdAt: new Date(),
    });

    await this.revenueService.create({
      amount: dto.amount,
      source:
        targetInstallment.installmentNumber === 0
          ? RevenueSource.DOWN_PAYMENT
          : RevenueSource.INSTALLMENT,
      studentId: student.id,
      sectionId: student.section.id,
      installmentId: targetInstallment.id,
      branchId: student.branch.id,
    });

    await this.installmentRepository.save(targetInstallment);

    let message = `تم دفع ${dto.amount} جنيه بنجاح من القسط رقم ${dto.installmentNumber}.`;

    if (targetInstallment.remainingAmount <= 0) {
      if (targetInstallment.installmentNumber === 0) {
        await this.installmentService.createMonthlyInstallments(student);
        student.installmentStage = 1;
        message =
          'تم سداد الدفعة المقدمة بالكامل! تم إنشاء الأقساط الشهرية بنجاح.';
        student.activities.push({
          title: 'تم إنشاء الأقساط الشهرية',
          subTitle: 'تم سداد الدفعة المقدمة بالكامل وبدء الأقساط الشهرية.',
          createdAt: new Date(),
        });
      } else {
        message = `تم سداد القسط رقم ${targetInstallment.installmentNumber} بالكامل. شكرًا على التزامك!`;
        student.activities.push({
          title: 'تم سداد قسط بالكامل',
          subTitle: `تم سداد القسط رقم ${targetInstallment.installmentNumber} بالكامل.`,
          createdAt: new Date(),
        });
      }
    }

    await this.studentRepository.save(student);

    return {
      message,
      student: await this.findOne(student.id),
    };
  }

  async logPresence(studentId: string, lessonName: string): Promise<Student> {
    const student = await this.findOne(studentId);
    student.activities.push({
      title: 'تم تسجيل حضور',
      subTitle: `تم تسجيل حضور الطالب في حصة ${lessonName}.`,
      createdAt: new Date(),
    });
    return this.studentRepository.save(student);
  }

  async logAbsence(studentId: string, lessonName: string): Promise<Student> {
    const student = await this.findOne(studentId);
    student.activities.push({
      title: 'تم تسجيل غياب',
      subTitle: `تم تسجيل غياب الطالب في حصة ${lessonName}.`,
      createdAt: new Date(),
    });
    return this.studentRepository.save(student);
  }


 async findAll(
  branchId?: string,
  sectionId?: string,
  isLate?: string,
  user?: any, // من @GetSignedUser()
): Promise<{ students: Student[] }> {
  const query = this.studentRepository
    .createQueryBuilder('student')
    .leftJoinAndSelect('student.teachers', 'teachers')
    .leftJoinAndSelect('student.installments', 'installments')
    .leftJoinAndSelect('student.branch', 'branch')
    .leftJoinAndSelect('student.section', 'section')
    .leftJoinAndSelect('student.attendances', 'attendances')
    .leftJoinAndSelect('attendances.lesson', 'attendedLesson');

  // ✅ الحالة الأولى: المستخدم مساعد ASSISTANT
  if (user.role === UserRole.ASSISTANT) {
    // نجيب بيانات المساعد علشان نعرف الفرع بتاعه
    const assistant = await this.assistantRepository.findOne({
      where: { userId: user.id },
      relations: ['branch'], // فقط الفرع
    });

    // لو المساعد مش مربوط بفرع -> نرجع قائمة فاضية
    if (!assistant || !assistant.branch?.id) {
      return { students: [] };
    }

    // نفلتر الطلاب بنفس الفرع بتاع المساعد فقط
    query.andWhere('student.branch.id = :branchId', {
      branchId: assistant.branch.id,
    });
  }

  // ✅ الحالة الثانية: المستخدم ADMIN أو غيره
  else if (user.role === UserRole.ADMIN) {
    if (branchId) {
      query.andWhere('student.branch.id = :branchId', { branchId });
    }

    if (sectionId) {
      const keyword = decodeURIComponent(sectionId);
      query.andWhere('section.name ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }
  }

  // ✅ تنفيذ الاستعلام
  const students = await query.getMany();

  // ✅ إعادة حساب الحالة المالية لكل طالب
  let studentsWithRecalculatedData = students.map((student) =>
    this.recalculateStudentFinancials(student),
  );

  // ✅ فلترة المتأخرين لو مطلوبة
  if (isLate === 'true') {
    studentsWithRecalculatedData = studentsWithRecalculatedData.filter(
      (student) => student.isLate,
    );
  }

  return { students: studentsWithRecalculatedData };
}



 async findAllName(user?: any): Promise<{
  students: { id: string; firstName: string; lastName: string }[];
}> {
  const query = this.studentRepository
    .createQueryBuilder('student')
    .select(['student.id', 'student.firstName', 'student.lastName'])
    .leftJoin('student.branch', 'branch');

  // ✅ لو المستخدم Assistant، نجيب الفرع بتاعه ونفلتر بالفرع
  if (user.role === UserRole.ASSISTANT) {
    const assistant = await this.assistantRepository.findOne({
      where: { userId: user.id },
      relations: ['branch'],
    });

    if (!assistant || !assistant.branch?.id) {
      return { students: [] };
    }

    query.andWhere('branch.id = :branchId', {
      branchId: assistant.branch.id,
    });
  }

  // ✅ لو المستخدم Admin أو أي Role تاني، نجيب كل الطلاب
  const students = await query.getMany();

  return { students };
}


  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: [
        'teachers',
        'lessons',
        'installments',
        'branch',
        'section',
        'attendances',
        'attendances.lesson',
      ],
    });
    if (!student) {
      throw new NotFoundException('هذا الطالب غير موجود');
    }

    return this.recalculateStudentFinancials(student);
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { phoneNumber },
      relations: ['teachers', 'lessons', 'branch', 'section', 'installments'],
    });
    if (!student) {
      throw new NotFoundException(
        'هذا الطالب غير موجود with this phone number',
      );
    }
    return this.recalculateStudentFinancials(student);
  }

  async findByManualEntryId(manualEntryId: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { manualEntryId },
      relations: ['teachers', 'lessons', 'branch', 'section', 'installments'],
    });
    if (!student) {
      throw new NotFoundException('هذا الطالب غير موجود with this manual ID');
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
      throw new NotFoundException('هذا الطالب غير موجود');
    }
    return student.teachers;
  }

  async getStudentLessons(id: string): Promise<Lesson[]> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['lessons'],
    });
    if (!student) {
      throw new NotFoundException('هذا الطالب غير موجود');
    }
    return student.lessons;
  }
}