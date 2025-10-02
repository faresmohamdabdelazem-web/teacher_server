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
const cloudinary_service_1 = require("../../cloudinary/cloudinary.service");
const installment_service_1 = require("../../Installment/installment.service");
const installment_entity_1 = require("../../Installment/entities/installment.entity");
const branch_entity_1 = require("../../branch/entities/branch.entity");
let StudentService = class StudentService {
    constructor(studentRepository, installmentRepository, branchRepository, cloudinary, installmentService) {
        this.studentRepository = studentRepository;
        this.installmentRepository = installmentRepository;
        this.branchRepository = branchRepository;
        this.cloudinary = cloudinary;
        this.installmentService = installmentService;
    }
    async create(createStudentDto) {
        const { branchId, nationalId, section, phoneNumber } = createStudentDto;
        if (phoneNumber) {
            const existingStudentByPhone = await this.studentRepository.findOneBy({
                phoneNumber: phoneNumber,
            });
            if (existingStudentByPhone) {
                throw new common_1.ConflictException('Student with this phone number already exists');
            }
        }
        const branch = await this.branchRepository.findOneBy({ id: branchId });
        if (!branch) {
            throw new common_1.BadRequestException(`Branch with ID "${branchId}" not found`);
        }
        const branchInitial = branch.name.charAt(0).toUpperCase();
        const sectionInitial = section.charAt(0).toUpperCase();
        const nationalIdSuffix = nationalId.slice(-6);
        const generatedId = `${branchInitial}${sectionInitial}-${nationalIdSuffix}`;
        const existingStudentById = await this.studentRepository.findOneBy({
            id: generatedId,
        });
        if (existingStudentById) {
            throw new common_1.ConflictException(`A student with the generated ID "${generatedId}" already exists. This may indicate a duplicate national ID.`);
        }
        const totalAmount = createStudentDto.totalAmount || 0;
        const downPayment = createStudentDto.downPayment || 0;
        const remainingDownPayment = createStudentDto.remainingDownPayment || 0;
        if (totalAmount <= downPayment) {
            throw new common_1.BadRequestException('Total amount must be greater than down payment');
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
        if (savedStudent.remainingDownPayment &&
            savedStudent.remainingDownPayment > 0) {
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
        const currentInstallment = await this.installmentRepository.findOne({
            where: {
                studentId: student.id,
                installmentNumber: student.installmentStage,
            },
        });
        if (!currentInstallment) {
            throw new common_1.NotFoundException('No active installment found for the current stage');
        }
        if (dto.amount > currentInstallment.remainingAmount) {
            throw new common_1.BadRequestException('القيمة المالية اكبر من القيمة المستحقة ');
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
    async findAll() {
        const students = await this.studentRepository.find({
            relations: ['teachers', 'lessons', 'installments', 'branch'],
        });
        return { students };
    }
    async findOne(id) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['teachers', 'lessons', 'installments', 'branch'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return student;
    }
    async findByPhoneNumber(phoneNumber) {
        const student = await this.studentRepository.findOne({
            where: { phoneNumber },
            relations: ['teachers', 'lessons', 'branch'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found with this phone number');
        }
        return student;
    }
    async findByManualEntryId(manualEntryId) {
        const student = await this.studentRepository.findOne({
            where: { manualEntryId },
            relations: ['teachers', 'lessons', 'branch'],
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        cloudinary_service_1.CloudinaryService,
        installment_service_1.InstallmentService])
], StudentService);
//# sourceMappingURL=student.service.js.map