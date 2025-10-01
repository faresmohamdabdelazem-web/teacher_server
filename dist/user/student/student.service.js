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
const hatly_constants_1 = require("../../hatly.constants");
const installment_service_1 = require("../../Installment/installment.service");
let StudentService = class StudentService {
    constructor(studentRepository, cloudinary, installmentPay) {
        this.studentRepository = studentRepository;
        this.cloudinary = cloudinary;
        this.installmentPay = installmentPay;
    }
    async create(createStudentDto) {
        const totalAmount = createStudentDto.totalAmount || 0;
        const downPayment = createStudentDto.downPayment || 0;
        const remainingDownPayment = createStudentDto.remainingDownPayment ?? downPayment;
        if (totalAmount <= downPayment) {
            throw new common_1.BadRequestException(`قيمة المبلغ الكلي (${totalAmount}) يجب أن تكون أكبر من المقدم (${downPayment})`);
        }
        if (remainingDownPayment >= downPayment) {
            throw new common_1.BadRequestException(`باقي المقدم (${remainingDownPayment}) يجب أن يكون اصغر من او يساوي المقدم (${downPayment})`);
        }
        const student = this.studentRepository.create({
            ...createStudentDto,
            remainingDownPayment,
            installmentStage: 0,
        });
        const savedStudent = await this.studentRepository.save(student);
        const remainingAmount = totalAmount - downPayment;
        const monthlyInstallment = remainingAmount / 12;
        const installments = [];
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
    async findAll() {
        const students = await this.studentRepository.find({
            relations: ['teachers', 'lessons', 'installments'],
        });
        return { students };
    }
    async findOne(id) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['teachers', 'lessons'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return student;
    }
    async findByPhoneNumber(phoneNumber) {
        const student = await this.studentRepository.findOne({
            where: { phoneNumber: phoneNumber },
            relations: ['teachers', 'lessons'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return { student };
    }
    async findById(id) {
        const student = await this.studentRepository.findOne({
            where: { id: id },
            relations: ['teachers', 'lessons'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return { student };
    }
    async update(id, updateStudentDto) {
        const student = await this.findOne(id);
        if (updateStudentDto.phoneNumber && updateStudentDto.phoneNumber !== student.phoneNumber) {
            const existingStudent = await this.studentRepository.findOne({
                where: { phoneNumber: updateStudentDto.phoneNumber },
            });
            if (existingStudent) {
                throw new common_1.ConflictException('Student with this phone number already exists');
            }
        }
        if (updateStudentDto.manualEntryId && updateStudentDto.manualEntryId !== student.manualEntryId) {
            const existingManualId = await this.studentRepository.findOne({
                where: { manualEntryId: updateStudentDto.manualEntryId },
            });
            if (existingManualId) {
                throw new common_1.ConflictException('Student with this manualEntryId already exists');
            }
        }
        if (updateStudentDto.profilePhoto && !updateStudentDto.profilePhoto.startsWith('http')) {
            updateStudentDto.profilePhoto = await this.cloudinary.uploadBase64(updateStudentDto.profilePhoto, hatly_constants_1.PROFILE_PHOTO_FILE, `student_${updateStudentDto.phoneNumber || Date.now()}`);
        }
        if (updateStudentDto.notes) {
            updateStudentDto.notes = updateStudentDto.notes.map(note => ({
                ...note,
                createdAt: note.createdAt || new Date(),
            }));
        }
        Object.assign(student, updateStudentDto);
        return await this.studentRepository.save(student);
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
        return { teachers: student.teachers };
    }
    async getStudentLessons(id) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['lessons'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return { lessons: student.lessons };
    }
    async findByManualEntryId(manualEntryId) {
        const student = await this.studentRepository.findOne({
            where: { manualEntryId: manualEntryId },
            relations: ['teachers', 'lessons'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return { student };
    }
};
exports.StudentService = StudentService;
exports.StudentService = StudentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        cloudinary_service_1.CloudinaryService,
        installment_service_1.InstallmentService])
], StudentService);
//# sourceMappingURL=student.service.js.map