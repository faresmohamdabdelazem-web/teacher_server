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
const lesson_attendance_entity_1 = require("../../lesson/entities/lesson-attendance.entity");
const pay_installment_dto_1 = require("../../Installment/dto/pay-installment.dto");
const installment_entity_1 = require("../../Installment/entities/installment.entity");
const branch_entity_1 = require("../../branch/entities/branch.entity");
const section_entity_1 = require("../../section/entities/section.entity");
const revenue_service_1 = require("../../revenues/revenue.service");
const revenues_entity_1 = require("../../revenues/entities/revenues.entity");
const user_role_enum_1 = require("../user.role.enum");
const revenues_entity_2 = require("../../revenues/entities/revenues.entity");
const assistant_entity_1 = require("../assistant/assistant.entity");
let StudentService = class StudentService {
    constructor(studentRepository, installmentRepository, branchRepository, sectionRepository, attendanceRepository, RevenueRepositry, assistantRepository, installmentService, revenueService) {
        this.studentRepository = studentRepository;
        this.installmentRepository = installmentRepository;
        this.branchRepository = branchRepository;
        this.sectionRepository = sectionRepository;
        this.attendanceRepository = attendanceRepository;
        this.RevenueRepositry = RevenueRepositry;
        this.assistantRepository = assistantRepository;
        this.installmentService = installmentService;
        this.revenueService = revenueService;
    }
    recalculateStudentFinancials(student) {
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
    async create(createStudentDto, user) {
        const { branchId, sectionId, phoneNumber, firstName, lastName } = createStudentDto;
        if (user.role === user_role_enum_1.UserRole.ASSISTANT) {
            const assistant = await this.assistantRepository.findOne({
                where: { user: { userId: user.id } },
                relations: ['branch'],
            });
            if (!assistant)
                throw new common_1.ForbiddenException('Assistant not found');
            if (assistant.branch.id !== branchId)
                throw new common_1.ForbiddenException('الطلب ليس من نفس فرع المساعد');
        }
        if (phoneNumber) {
            const existingStudentByPhone = await this.studentRepository.findOneBy({ phoneNumber });
            if (existingStudentByPhone)
                throw new common_1.ConflictException('Student with this phone number already exists');
        }
        const existingStudentByName = await this.studentRepository.findOne({ where: { firstName, lastName } });
        if (existingStudentByName)
            throw new common_1.ConflictException(`A student with the name "${firstName} ${lastName}" already exists`);
        const branch = await this.branchRepository.findOne({ where: { id: branchId }, relations: ['sections'] });
        if (!branch)
            throw new common_1.BadRequestException(`Branch with ID "${branchId}" not found`);
        const section = await this.sectionRepository.findOneBy({ id: sectionId });
        if (!section)
            throw new common_1.BadRequestException(`Section with ID "${sectionId}" not found`);
        const isSectionInBranch = branch.sections.some((s) => s.id === section.id);
        if (!isSectionInBranch)
            throw new common_1.BadRequestException(`Section "${section.name}" is not available in branch "${branch.name}"`);
        const lastStudent = await this.studentRepository.findOne({ where: {}, order: { createdAt: 'DESC' } });
        let newSequenceNumber = 1;
        if (lastStudent && lastStudent.id.includes('-')) {
            const lastIdParts = lastStudent.id.split('-');
            const lastNumber = parseInt(lastIdParts[lastIdParts.length - 1], 10);
            if (!isNaN(lastNumber))
                newSequenceNumber = lastNumber + 1;
        }
        const paddedSequence = newSequenceNumber.toString().padStart(6, '0');
        const branchInitial = branch.name.charAt(0).toUpperCase();
        const sectionInitial = section.name.charAt(0).toUpperCase();
        const generatedId = `${branchInitial}${sectionInitial}-${paddedSequence}`;
        const existingStudentById = await this.studentRepository.findOneBy({ id: generatedId });
        if (existingStudentById)
            throw new common_1.ConflictException(`A student with the generated ID "${generatedId}" already exists. Please try again.`);
        const totalAmount = createStudentDto.totalAmount || 0;
        const downPayment = createStudentDto.downPayment || 0;
        const paidDownPayment = downPayment - (createStudentDto.remainingDownPayment || 0);
        if (paidDownPayment < 0 || paidDownPayment > downPayment) {
            throw new common_1.BadRequestException('Paid down payment is invalid');
        }
        const studentData = {
            ...createStudentDto,
            id: generatedId,
            branch,
            section,
            totalAmount,
            downPayment,
            paidAmount: paidDownPayment,
            remainingBalance: totalAmount - paidDownPayment,
            installmentStage: 0,
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
        let initialInstallment = null;
        if (savedStudent.totalAmount > 0) {
            if (savedStudent.downPayment > 0) {
                initialInstallment = await this.installmentService.createInitialInstallment(savedStudent);
                if (paidDownPayment > 0) {
                    initialInstallment.amountPaid = paidDownPayment;
                    initialInstallment.remainingAmount = initialInstallment.amount - paidDownPayment;
                    initialInstallment.paymentHistory.push({
                        amount: paidDownPayment,
                        paidAt: new Date(),
                        cashReceiver: savedStudent.cashReceiver || user.name || 'Admin',
                        receiptNumber: savedStudent.receiptNumber || `DP-${Date.now()}`,
                        paymentType: pay_installment_dto_1.PaymentType.DOWN_PAYMENT,
                        throughPerson: savedStudent.throughPerson || user.name || 'user',
                    });
                    await this.installmentRepository.save(initialInstallment);
                    savedStudent.activities.push({
                        title: 'تم دفع دفعة مقدمة',
                        subTitle: `تم استلام مبلغ ${paidDownPayment} جنيه كدفعة مقدمة.`,
                        createdAt: new Date(),
                    });
                    await this.revenueService.create({
                        amount: paidDownPayment,
                        source: revenues_entity_1.RevenueSource.DOWN_PAYMENT,
                        studentId: savedStudent.id,
                        sectionId: savedStudent.section.id,
                        branchId: savedStudent.branch.id,
                        installmentId: initialInstallment.id,
                    });
                }
            }
            const isDownPaymentPaid = initialInstallment ? initialInstallment.remainingAmount <= 0 : false;
            if (savedStudent.downPayment === 0 || isDownPaymentPaid) {
                await this.installmentService.createMonthlyInstallments(savedStudent);
                savedStudent.installmentStage = 1;
                await this.studentRepository.save(savedStudent);
            }
        }
        return this.findOne(savedStudent.id);
    }
    getMonthNameFromInstallmentNumber(installmentNumber) {
        const months = [
            'أكتوبر', 'نوفمبر', 'ديسمبر', 'يناير', 'فبراير', 'مارس',
            'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر',
        ];
        const index = (installmentNumber - 1) % 12;
        return months[index];
    }
    async payInstallment(studentId, dto) {
        const student = await this.studentRepository.findOne({
            where: { id: studentId },
            relations: ['installments', 'section', 'branch'],
        });
        if (!student) {
            throw new common_1.NotFoundException('هذا الطالب غير موجود');
        }
        student.installments.sort((a, b) => a.installmentNumber - b.installmentNumber);
        const nextDueInstallment = student.installments.find((inst) => inst.remainingAmount > 0);
        if (!nextDueInstallment) {
            throw new common_1.BadRequestException('جميع الأقساط تم سدادها بالكامل!');
        }
        if (dto.installmentNumber !== nextDueInstallment.installmentNumber) {
            const nextMonthName = nextDueInstallment.installmentNumber === 0
                ? 'الدفعة المقدمة'
                : this.getMonthNameFromInstallmentNumber(nextDueInstallment.installmentNumber);
            throw new common_1.BadRequestException(`لا يمكنك دفع هذا القسط الآن. القسط المستحق الحالي هو (${nextMonthName}) بمبلغ ${nextDueInstallment.remainingAmount} جنيه.`);
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
        if (!student.section || !student.branch) {
            throw new common_1.BadRequestException(`Data integrity error: Student with ID "${studentId}" does not have a section or branch assigned. Cannot process payment.`);
        }
        targetInstallment.amountPaid += dto.amount;
        targetInstallment.remainingAmount -= dto.amount;
        student.paidAmount += dto.amount;
        student.remainingBalance -= dto.amount;
        if (targetInstallment.installmentNumber === 0) {
            student.remainingDownPayment -= dto.amount;
        }
        if (!Array.isArray(targetInstallment.paymentHistory)) {
            targetInstallment.paymentHistory = [];
        }
        targetInstallment.paymentHistory.push({
            amount: dto.amount,
            paidAt: new Date(),
            cashReceiver: dto.cashReceiver,
            receiptNumber: dto.receiptNumber,
            paymentType: dto.paymentType,
            throughPerson: dto.throughPerson,
        });
        const activityTitle = targetInstallment.installmentNumber === 0
            ? 'تم دفع جزء من الدفعة المقدمة'
            : 'تم دفع قسط';
        const activitySubTitle = targetInstallment.installmentNumber === 0
            ? `تم دفع مبلغ ${dto.amount} جنيه.`
            : `تم دفع مبلغ ${dto.amount} جنيه للقسط رقم ${targetInstallment.installmentNumber}.`;
        student.activities.push({
            title: activityTitle,
            subTitle: activitySubTitle,
            createdAt: new Date(),
        });
        await this.revenueService.create({
            amount: dto.amount,
            source: targetInstallment.installmentNumber === 0
                ? revenues_entity_1.RevenueSource.DOWN_PAYMENT
                : revenues_entity_1.RevenueSource.INSTALLMENT,
            studentId: student.id,
            sectionId: student.section.id,
            installmentId: targetInstallment.id,
            branchId: student.branch.id,
        });
        let message = `تم دفع ${dto.amount} جنيه بنجاح من القسط رقم ${dto.installmentNumber}.`;
        if (targetInstallment.remainingAmount <= 0) {
            targetInstallment.status = installment_entity_1.InstallmentStatus.PAID;
            if (targetInstallment.installmentNumber === 0) {
                const newMonthlyInstallments = await this.installmentService.createMonthlyInstallments(student);
                student.installments = student.installments.concat(newMonthlyInstallments);
                student.installmentStage = 1;
                message =
                    'تم سداد الدفعة المقدمة بالكامل! تم إنشاء الأقساط الشهرية بنجاح.';
                student.activities.push({
                    title: 'تم إنشاء الأقساط الشهرية',
                    subTitle: 'تم سداد الدفعة المقدمة بالكامل وبدء الأقساط الشهرية.',
                    createdAt: new Date(),
                });
            }
            else {
                message = `تم سداد القسط رقم ${targetInstallment.installmentNumber} بالكامل. شكرًا على التزامك!`;
                student.activities.push({
                    title: 'تم سداد قسط بالكامل',
                    subTitle: `تم سداد القسط رقم ${targetInstallment.installmentNumber} بالكامل.`,
                    createdAt: new Date(),
                });
            }
        }
        await this.installmentRepository.save(targetInstallment);
        await this.studentRepository.save(student);
        if (student.installments && student.installments.length > 0) {
            student.installments.sort((a, b) => a.installmentNumber - b.installmentNumber);
        }
        return {
            message,
            student: await this.findOne(student.id),
        };
    }
    async logPresence(studentId, lessonName) {
        const student = await this.findOne(studentId);
        student.activities.push({
            title: 'تم تسجيل حضور',
            subTitle: `تم تسجيل حضور الطالب في حصة ${lessonName}.`,
            createdAt: new Date(),
        });
        return this.studentRepository.save(student);
    }
    async logAbsence(studentId, lessonName) {
        const student = await this.findOne(studentId);
        student.activities.push({
            title: 'تم تسجيل غياب',
            subTitle: `تم تسجيل غياب الطالب في حصة ${lessonName}.`,
            createdAt: new Date(),
        });
        return this.studentRepository.save(student);
    }
    async findAll(branchId, sectionId, isLate, phoneNumber, name, user) {
        const query = this.studentRepository
            .createQueryBuilder('student')
            .leftJoinAndSelect('student.teachers', 'teachers')
            .leftJoinAndSelect('student.installments', 'installments')
            .leftJoinAndSelect('student.branch', 'branch')
            .leftJoinAndSelect('student.section', 'section')
            .leftJoinAndSelect('student.attendances', 'attendances')
            .leftJoinAndSelect('attendances.lesson', 'attendedLesson');
        if (user.role === user_role_enum_1.UserRole.ASSISTANT) {
            const assistant = await this.assistantRepository.findOne({
                where: { userId: user.id },
                relations: ['branch'],
            });
            if (!assistant || !assistant.branch?.id) {
                return { students: [] };
            }
            query.andWhere('student.branch.id = :branchId', {
                branchId: assistant.branch.id,
            });
        }
        else if (user.role === user_role_enum_1.UserRole.ADMIN) {
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
        if (name) {
            const keyword = `%${decodeURIComponent(name)}%`;
            query.andWhere('(student.firstName ILIKE :keyword OR student.lastName ILIKE :keyword OR student.phoneNumber ILIKE :keyword)', { keyword });
        }
        const students = await query.getMany();
        students.forEach(student => {
            if (student.installments && student.installments.length > 0) {
                student.installments.sort((a, b) => a.installmentNumber - b.installmentNumber);
            }
        });
        let studentsWithRecalculatedData = students.map((student) => this.recalculateStudentFinancials(student));
        if (isLate === 'true') {
            studentsWithRecalculatedData = studentsWithRecalculatedData.filter((student) => student.isLate);
        }
        return { students: studentsWithRecalculatedData };
    }
    async findAllName(user) {
        const query = this.studentRepository
            .createQueryBuilder('student')
            .select(['student.id', 'student.firstName', 'student.lastName'])
            .leftJoin('student.branch', 'branch');
        if (user.role === user_role_enum_1.UserRole.ASSISTANT) {
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
        const students = await query.getMany();
        return { students };
    }
    async findOne(id) {
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
            throw new common_1.NotFoundException('هذا الطالب غير موجود');
        }
        if (student.installments && student.installments.length > 0) {
            student.installments.sort((a, b) => a.installmentNumber - b.installmentNumber);
        }
        return this.recalculateStudentFinancials(student);
    }
    async findByPhoneNumber(phoneNumber) {
        const student = await this.studentRepository.findOne({
            where: { phoneNumber },
            relations: ['teachers', 'lessons', 'branch', 'section', 'installments'],
        });
        if (!student) {
            throw new common_1.NotFoundException('هذا الطالب غير موجود with this phone number');
        }
        return this.recalculateStudentFinancials(student);
    }
    async findByManualEntryId(manualEntryId) {
        const student = await this.studentRepository.findOne({
            where: { manualEntryId },
            relations: ['teachers', 'lessons', 'branch', 'section', 'installments'],
        });
        if (!student) {
            throw new common_1.NotFoundException('هذا الطالب غير موجود with this manual ID');
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
        const student = await this.studentRepository.findOne({ where: { id } });
        if (!student) {
            return { message: 'Student not found' };
        }
        await this.studentRepository.manager.transaction(async (manager) => {
            await Promise.all([
                manager.delete(this.attendanceRepository.target, { student: { id } }),
                manager.delete(this.installmentRepository.target, { student: { id } }),
                manager.delete(this.RevenueRepositry.target, { student: { id } }),
            ]);
            await manager.delete(this.studentRepository.target, id);
        });
        return { message: 'Student deleted successfully' };
    }
    async getStudentTeachers(id) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['teachers'],
        });
        if (!student) {
            throw new common_1.NotFoundException('هذا الطالب غير موجود');
        }
        return student.teachers;
    }
    async getStudentLessons(id) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['lessons'],
        });
        if (!student) {
            throw new common_1.NotFoundException('هذا الطالب غير موجود');
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
    __param(4, (0, typeorm_1.InjectRepository)(lesson_attendance_entity_1.LessonAttendance)),
    __param(5, (0, typeorm_1.InjectRepository)(revenues_entity_2.Revenue)),
    __param(6, (0, typeorm_1.InjectRepository)(assistant_entity_1.Assistant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        installment_service_1.InstallmentService,
        revenue_service_1.RevenueService])
], StudentService);
//# sourceMappingURL=student.service.js.map