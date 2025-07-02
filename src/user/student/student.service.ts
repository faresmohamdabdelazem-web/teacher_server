import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './create-student.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PROFILE_PHOTO_FILE } from 'src/hatly.constants';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private cloudinary: CloudinaryService,
  ) { }

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    // Check if email already exists (only if email is provided)
    if (createStudentDto.phoneNumber) {
      const existingStudent = await this.studentRepository.findOne({
        where: { phoneNumber: createStudentDto.phoneNumber },
      });

      if (existingStudent) {
        throw new ConflictException('Student with this phone number already exists');
      }
    }

    // Generate or validate manualEntryId
    let manualEntryId = createStudentDto.manualEntryId;
    if (manualEntryId) {
      // Validate uniqueness
      const existingManualId = await this.studentRepository.findOne({ where: { manualEntryId } });
      if (existingManualId) {
        throw new ConflictException('Student with this manualEntryId already exists');
      }
    } else {
      // Generate unique 7-digit id with retry limit
      const maxRetries = 10;
      let retryCount = 0;
      let isUnique = false;

      while (!isUnique && retryCount < maxRetries) {
        manualEntryId = Math.floor(1000000 + Math.random() * 9000000).toString();
        const existingManualId = await this.studentRepository.findOne({ where: { manualEntryId } });
        if (!existingManualId) {
          isUnique = true;
        }
        retryCount++;
      }

      if (!isUnique) {
        throw new ConflictException('Unable to generate unique manualEntryId after maximum retries');
      }
    }

    let profilePhotoUrl = createStudentDto.profilePhoto;
    console.log(profilePhotoUrl);
    if (profilePhotoUrl && !profilePhotoUrl.startsWith('http')) {
      // Assume base64, upload to Cloudinary
      profilePhotoUrl = await this.cloudinary.uploadBase64(
        profilePhotoUrl,
        PROFILE_PHOTO_FILE,
        `student_${createStudentDto.phoneNumber || Date.now()}`
      );
    }

    const student = this.studentRepository.create({
      ...createStudentDto,
      profilePhoto: profilePhotoUrl,
      manualEntryId,
    });
    console.log(student);
    const savedStudent = await this.studentRepository.save(student);
    console.log(savedStudent);
    return savedStudent;
  }

  async findAll(): Promise<{ students: Student[] }> {
    const students = await this.studentRepository.find({
      relations: ['teachers', 'lessons'],
    });
    return { students };
  }

  async findOne(id: string): Promise<{ student: Student }> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['teachers', 'lessons'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return { student };
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

    // Check if email is being updated and if it already exists
    if (updateStudentDto.id && updateStudentDto.id !== student.student.id) {
      const existingStudent = await this.studentRepository.findOne({
        where: { id: updateStudentDto.id },
      });

      if (!existingStudent) {
        throw new ConflictException('Student with this studentId not found');
      }
    }

    Object.assign(student.student, updateStudentDto);
    return await this.studentRepository.save(student.student);
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentRepository.remove(student.student);
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