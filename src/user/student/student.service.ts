import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './create-student.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PROFILE_PHOTO_FILE } from 'src/hatly.constants';
import { InstallmentService } from 'src/Installment/installment.service';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private cloudinary: CloudinaryService,
    private installmentPay:InstallmentService
  ) { }

async create(createStudentDto: CreateStudentDto): Promise<Student> {
  const totalAmount = createStudentDto.totalAmount || 0;
  const downPayment = createStudentDto.downPayment || 0;
  const remainingDownPayment = createStudentDto.remainingDownPayment ?? downPayment;

  // التحقق من صحة المبالغ
  if (totalAmount <= downPayment) {
    throw new BadRequestException(
      `قيمة المبلغ الكلي (${totalAmount}) يجب أن تكون أكبر من المقدم (${downPayment})`
    );
  }

  if (remainingDownPayment >= downPayment) {
    throw new BadRequestException(
      `باقي المقدم (${remainingDownPayment}) يجب أن يكون اصغر من او يساوي المقدم (${downPayment})`
    );
  }

  // إنشاء الطالب
  const student = this.studentRepository.create({
    ...createStudentDto,
    remainingDownPayment,
    installmentStage: 0,
  });

  const savedStudent = await this.studentRepository.save(student);

  const remainingAmount = totalAmount - downPayment;
  const monthlyInstallment = remainingAmount / 12;

  const installments = [];

  // لو فيه باقي مقدم، نضيفه كقسط أول
  if (remainingDownPayment > 0) {
    const installment = await this.installmentPay.create({
      studentId: savedStudent.id,
      installmentNumber: 0,
      amount: remainingDownPayment,
      monthNumber: 0,
      cashReceiver: createStudentDto.cashReceiver || 'Admin',
      installmentStage: 0,
    });
    installments.push(installment);
    student.remainingDownPayment = 0;
  }

  // الأقساط الشهرية بعد المقدم
  for (let i = 1; i <= 12; i++) {
    const installment = await this.installmentPay.create({
      studentId: savedStudent.id,
      installmentNumber: i,
      amount: monthlyInstallment,
      monthNumber: i,
      cashReceiver: createStudentDto.cashReceiver || 'Admin',
      installmentStage: 1,
    });
    installments.push(installment);
  }

  student.installmentStage = 1;
  await this.studentRepository.save(student);

  return savedStudent;
}



  async findAll(): Promise<{ students: Student[] }> {
    const students = await this.studentRepository.find({
      relations: ['teachers', 'lessons','installments'],
    });
    return { students };
  }

 async findOne(id: string): Promise<Student> {
  const student = await this.studentRepository.findOne({
    where: { id },
    relations: ['teachers', 'lessons'],
  });

  if (!student) {
    throw new NotFoundException('Student not found');
  }

  return student; // ✅ رجّع Student نفسه مش object جواه
}


  async findByPhoneNumber(phoneNumber: string): Promise<{ student: Student }> {
    const student = await this.studentRepository.findOne({
      where: { phoneNumber: phoneNumber },
      relations: ['teachers', 'lessons'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return { student };
  }

  async findById(id: string): Promise<{ student: Student }> {
    const student = await this.studentRepository.findOne({
      where: { id: id },
      relations: ['teachers', 'lessons'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return { student };
  }

async update(id: string, updateStudentDto: Partial<CreateStudentDto>): Promise<Student> {
  const student = await this.findOne(id);

  // ✅ تحقق من phoneNumber
  if (updateStudentDto.phoneNumber && updateStudentDto.phoneNumber !== student.phoneNumber) {
    const existingStudent = await this.studentRepository.findOne({
      where: { phoneNumber: updateStudentDto.phoneNumber },
    });

    if (existingStudent) {
      throw new ConflictException('Student with this phone number already exists');
    }
  }

  // ✅ تحقق من manualEntryId
  if (updateStudentDto.manualEntryId && updateStudentDto.manualEntryId !== student.manualEntryId) {
    const existingManualId = await this.studentRepository.findOne({
      where: { manualEntryId: updateStudentDto.manualEntryId },
    });

    if (existingManualId) {
      throw new ConflictException('Student with this manualEntryId already exists');
    }
  }

  // ✅ رفع الصورة لو اتغيرت
  if (updateStudentDto.profilePhoto && !updateStudentDto.profilePhoto.startsWith('http')) {
    updateStudentDto.profilePhoto = await this.cloudinary.uploadBase64(
      updateStudentDto.profilePhoto,
      PROFILE_PHOTO_FILE,
      `student_${updateStudentDto.phoneNumber || Date.now()}`
    );
  }

  // ✅ تحديث الـ notes
  if (updateStudentDto.notes) {
    updateStudentDto.notes = updateStudentDto.notes.map(note => ({
      ...note,
      createdAt: note.createdAt || new Date(), 
    }));
  }

  Object.assign(student, updateStudentDto);
  return await this.studentRepository.save(student);
}


async remove(id: string): Promise<void> {
  const student = await this.findOne(id); // ده Student مش object فيه student
  await this.studentRepository.remove(student);
}


  async getStudentTeachers(id: string): Promise<{ teachers: any[] }> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['teachers'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return { teachers: student.teachers };
  }

  async getStudentLessons(id: string): Promise<{ lessons: any[] }> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['lessons'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return { lessons: student.lessons };
  }

  async findByManualEntryId(manualEntryId: string): Promise<{ student: Student }> {
    const student = await this.studentRepository.findOne({
      where: { manualEntryId: manualEntryId },
      relations: ['teachers', 'lessons'],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return { student };
  }
} 