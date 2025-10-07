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
const pay_installment_dto_1 = require("../../Installment/dto/pay-installment.dto");
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
    recalculateStudentFinancials(student) {
        if (!student.installments) {
            return student;
        }
        const downPaymentInstallment = student.installments.find(inst => inst.installmentNumber === 0);
        student.remainingDownPayment = downPaymentInstallment
            ? downPaymentInstallment.remainingAmount
            : 0;
        student.remainingBalance = student.totalAmount - student.paidAmount;
        const currentDate = new Date();
        const requiredInstallment = student.installments.find(inst => {
            return inst.dueDate < currentDate && inst.status !== installment_entity_1.InstallmentStatus.PAID;
        });
        student.isLate = !!requiredInstallment;
        return student;
    }
    async create(createStudentDto) {
        const { branchId, sectionId, phoneNumber } = createStudentDto;
        if (phoneNumber) {
            const existingStudentByPhone = await this.studentRepository.findOneBy({ phoneNumber });
            if (existingStudentByPhone) {
                throw new common_1.ConflictException('Student with this phone number already exists');
            }
        }
        const branch = await this.branchRepository.findOne({
            where: { id: branchId },
            relations: ['sections'],
        });
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
        const totalAmount = createStudentDto.totalAmount;
        const downPayment = createStudentDto.downPayment;
        const remainingDownPayment = createStudentDto.remainingDownPayment ?? 0;
        const paidDownPayment = downPayment - remainingDownPayment;
        if (paidDownPayment > downPayment) {
            throw new common_1.BadRequestException('Paid down payment cannot be greater than the required down payment');
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
        };
        delete studentData.branchId;
        delete studentData.sectionId;
        const student = this.studentRepository.create(studentData);
        const savedStudent = await this.studentRepository.save(student);
        if (paidDownPayment > 0) {
            savedStudent.paymentHistory.push({
                amount: paidDownPayment,
                paidAt: new Date(),
                cashReceiver: savedStudent.cashReceiver || 'Admin',
                receiptNumber: `DP-${Date.now()}`,
                installmentNumber: 0,
                paymentType: pay_installment_dto_1.PaymentType.DOWN_PAYMENT,
                throughPerson: savedStudent.throughPerson || "user"
            });
            await this.studentRepository.save(savedStudent);
        }
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
        const student = await this.studentRepository.findOne({
            where: { id: studentId },
            relations: ['installments'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const nextDueInstallment = student.installments.find((inst) => inst.remainingAmount > 0);
        if (!nextDueInstallment && dto.paymentType === pay_installment_dto_1.PaymentType.DOWN_PAYMENT) {
            throw new common_1.BadRequestException(`✅ لقد انتهيت من جميع الأقساط بالفعل. لا يمكنك دفع دفعة مقدمة بعد الآن. 
يرجى اختيار "جزء من القسط" أو "دفع كامل القسط" إذا كان هناك قسط جديد.`);
        }
        if (!nextDueInstallment) {
            throw new common_1.BadRequestException('جميع الأقساط تم سدادها بالكامل!');
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
            throw new common_1.BadRequestException(`لا يمكنك دفع هذا القسط الآن. القسط المستحق الحالي هو ر (${nextMonthName}) بمبلغ ${nextDueInstallment.remainingAmount} جنيه.`);
        }
        const targetInstallment = nextDueInstallment;
        if (targetInstallment.status === installment_entity_1.InstallmentStatus.PAID) {
            throw new common_1.BadRequestException('✅ هذا القسط تم سداده بالكامل بالفعل.');
        }
        if (dto.paymentType === pay_installment_dto_1.PaymentType.FULL &&
            dto.amount < targetInstallment.remainingAmount) {
            throw new common_1.BadRequestException(` المبلغ المدخل (${dto.amount} جنيه) لا يغطي القسط بالكامل (${targetInstallment.remainingAmount} جنيه). 
يرجى اختيار نوع الدفع "جزء من القسط" بدلاً من "دفع كامل القسط".`);
        }
        if (dto.amount > targetInstallment.remainingAmount) {
            throw new common_1.BadRequestException(`⚠️ المبلغ المدفوع أكبر من المبلغ المستحق (${targetInstallment.remainingAmount} جنيه).`);
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
            throughPerson: dto.throughPerson
        });
        await this.installmentRepository.save(targetInstallment);
        let message = `تم دفع ${dto.amount} جنيه بنجاح من القسط رقم ${dto.installmentNumber}.`;
        if (targetInstallment.remainingAmount <= 0) {
            if (targetInstallment.installmentNumber === 0) {
                await this.installmentService.createMonthlyInstallments(student);
                student.installmentStage = 1;
                message =
                    'تم سداد الدفعة المقدمة بالكامل! تم إنشاء الأقساط الشهرية بنجاح.';
            }
            else {
                message = `تم سداد القسط رقم ${targetInstallment.installmentNumber} بالكامل. شكرًا على التزامك!`;
            }
        }
        await this.studentRepository.save(student);
        return {
            message,
            student: await this.findOne(student.id),
        };
    }
    async findAll() {
        const students = await this.studentRepository.find({
            relations: ['teachers', 'lessons', 'installments', 'branch', 'section'],
        });
        const studentsWithRecalculatedData = students.map(student => this.recalculateStudentFinancials(student));
        return { students: studentsWithRecalculatedData };
    }
    async findOne(id) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['teachers', 'lessons', 'installments', 'branch', 'section'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return this.recalculateStudentFinancials(student);
    }
    async findByPhoneNumber(phoneNumber) {
        const student = await this.studentRepository.findOne({
            where: { phoneNumber },
            relations: ['teachers', 'lessons', 'branch', 'section', 'installments'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found with this phone number');
        }
        return this.recalculateStudentFinancials(student);
    }
    async findByManualEntryId(manualEntryId) {
        const student = await this.studentRepository.findOne({
            where: { manualEntryId },
            relations: ['teachers', 'lessons', 'branch', 'section', 'installments'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found with this manual ID');
        }
        return this.recalculateStudentFinancials(student);
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