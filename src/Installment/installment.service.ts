import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Installment } from './entities/installment.entity';
import { CreateInstallmentDto } from './dto/create-installment.dto';
import { Student } from 'src/user/student/student.entity';
import { StudentService } from 'src/user/student/student.service';

@Injectable()
export class InstallmentService {
    constructor(
        @InjectRepository(Installment)
        private installmentRepository: Repository<Installment>,
        @InjectRepository(Student)
        private studentRepository: Repository<Student>,
        
        
    ) { }

    async create(dto: CreateInstallmentDto): Promise<Installment> {
        const student = await this.studentRepository.findOne({
            where: { id: dto.studentId },
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        // مصفوفة الشهور
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ];

        // توليد اسم الشهر من الرقم
        const monthName = months[dto.monthNumber - 1];

        const installment = this.installmentRepository.create({
            ...dto,
 
            student,
        });

        return this.installmentRepository.save(installment);
    }


    async findAll(): Promise<Installment[]> {
        return this.installmentRepository.find({ relations: ['student'] });
    }

    async findByStudent(studentId: string): Promise<Installment[]> {
        return this.installmentRepository.find({
            where: { studentId },
            relations: ['student'],
        });
    }
}
