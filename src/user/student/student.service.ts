import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './create-student.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

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

    const student = this.studentRepository.create(createStudentDto);
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

  async findByPhoneNumber(phoneNumber: string): Promise<Student | null> {
    return await this.studentRepository.findOne({
      where: { phoneNumber: phoneNumber },
    });
  }

  async findById(id: string): Promise<{ student: Student } | null> {
    const student = await this.studentRepository.findOne({
      where: { id: id },
      relations: ['teachers', 'lessons'],
    });

    if (!student) {
      return null;
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
} 