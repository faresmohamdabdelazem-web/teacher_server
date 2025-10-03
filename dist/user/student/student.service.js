"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("./student.entity");
const installment_service_1 = require("../../Installment/installment.service");
const installment_entity_1 = require("../../Installment/entities/installment.entity");
const branch_entity_1 = require("../../branch/entities/branch.entity");
const section_entity_1 = require("../../section/entities/section.entity");
let StudentService = class StudentService {
    constructor(studentRepository, installmentRepository, branchRepository, sectionRepository, installmentService) {
        this.studentRepository = studentRepository;
        this.installmentRepository = installmentRepository;
        this.branchRepository = branchRepository;
        this.sectionRepository = sectionRepository;
        this.installmentService = installmentService;
    }
    async create(createStudentDto) {
        const { branchId, sectionId, phoneNumber, nationalId } = createStudentDto;
        if (phoneNumber) {
            const existingStudentByPhone = await this.studentRepository.findOneBy({ phoneNumber });
            if (existingStudentByPhone) {
                throw new common_1.ConflictException('Student with this phone number already exists');
            }
        }
        const branch = await this.branchRepository.findOne({ where: { id: branchId }, relations: ['sections'] });
        if (!branch) {
            throw new common_1.BadRequestException(`Branch with ID "${branchId}" not found`);
        }
        const section = await this.sectionRepository.findOneBy({ id: sectionId });
        if (!section) {
            throw new common_1.BadRequestException(`Section with ID "${sectionId}" not found`);
        }
        const isSectionInBranch = branch.sections.some(s => s.id === section.id);
        if (!isSectionInBranch) {
            throw new common_1.BadRequestException(`Section "${section.name}" is not available in branch "${branch.name}"`);
        }
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
            throw new common_1.ConflictException(`A student with the generated ID "${generatedId}" already exists. Please try again.`);
        }
        const totalAmount = section.totalAmount;
        const downPayment = section.downPayment;
        const paidDownPayment = createStudentDto.paidDownPayment || 0;
        if (paidDownPayment > downPayment) {
            throw new common_1.BadRequestException('Paid down payment cannot be greater than the required down payment');
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
        }
        else {
            await this.installmentService.createMonthlyInstallments(savedStudent);
            savedStudent.installmentStage = 1;
            await this.studentRepository.save(savedStudent);
        }
        return this.findOne(savedStudent.id);
    }
    async payInstallment(studentId, dto) {
        const student = await this.studentRepository.findOneBy({ id: studentId });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const targetInstallment = await this.installmentRepository.findOne({
            where: {
                studentId: student.id,
                installmentNumber: dto.installmentNumber,
            },
        });
        if (!targetInstallment) {
            throw new common_1.NotFoundException('The specified installment does not exist for this student');
        }
        if (targetInstallment.status === installment_entity_1.InstallmentStatus.PAID) {
            throw new common_1.BadRequestException('This installment is already fully paid');
        }
        if (dto.amount > targetInstallment.remainingAmount) {
            throw new common_1.BadRequestException('القيمة المالية اكبر من القيمة المستحقة ');
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
    async findAll() {
        const students = await this.studentRepository.find({
            relations: ['teachers', 'lessons', 'installments', 'branch', 'section'],
        });
        return { students };
    }
    async findOne(id) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['teachers', 'lessons', 'installments', 'branch', 'section'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return student;
    }
    async findByPhoneNumber(phoneNumber) {
        const student = await this.studentRepository.findOne({
            where: { phoneNumber },
            relations: ['teachers', 'lessons', 'branch', 'section'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found with this phone number');
        }
        return student;
    }
    async findByManualEntryId(manualEntryId) {
        const student = await this.studentRepository.findOne({
            where: { manualEntryId },
            relations: ['teachers', 'lessons', 'branch', 'section'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found with this manual ID');
        }
        return student;
    }
    async update(id, updateStudentDto) {
        const student = await this.findOne(id);
        Object.assign(student, updateStudentDto);
        await this.studentRepository.save(student);
        return this.findOne(id);
    }
    async remove(id) {
        const student = await this.findOne(id);
        await this.studentRepository.remove(student);
    }
    async getStudentTeachers(id) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['teachers'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return student.teachers;
    }
    async getStudentLessons(id) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['lessons'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return student.lessons;
    }
};
exports.StudentService = StudentService;
exports.StudentService = StudentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(installment_entity_1.Installment)),
    __param(2, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __param(3, (0, typeorm_1.InjectRepository)(section_entity_1.Section)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        installment_service_1.InstallmentService])
], StudentService);
//# sourceMappingURL=student.service.js.map