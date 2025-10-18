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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = void 0;
const typeorm_1 = require("typeorm");
const teacher_entity_1 = require("../teacher/teacher.entity");
const lesson_entity_1 = require("../../lesson/entities/lesson.entity");
const installment_entity_1 = require("../../Installment/entities/installment.entity");
const branch_entity_1 = require("../../branch/entities/branch.entity");
const section_entity_1 = require("../../section/entities/section.entity");
const revenues_entity_1 = require("../../revenues/entities/revenues.entity");
const lesson_attendance_entity_1 = require("../../lesson/entities/lesson-attendance.entity");
let Student = class Student {
};
exports.Student = Student;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Student.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Student.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Student.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, unique: true }),
    __metadata("design:type", String)
], Student.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "whatsapp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "parentPhoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "grade", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "nationalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, default: [] }),
    __metadata("design:type", Array)
], Student.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "profilePhoto", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "manualEntryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Student.prototype, "installmentStage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Student.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Student.prototype, "downPayment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Student.prototype, "remainingDownPayment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], Student.prototype, "paidAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Student.prototype, "remainingBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "throughPerson", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, (branch) => branch.students, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'branchId' }),
    __metadata("design:type", branch_entity_1.Branch)
], Student.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => section_entity_1.Section, (section) => section.students),
    (0, typeorm_1.JoinColumn)({ name: 'sectionId' }),
    __metadata("design:type", section_entity_1.Section)
], Student.prototype, "section", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "sectionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "cashReceiver", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "receiptNumber", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Student.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Student.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => teacher_entity_1.Teacher, (teacher) => teacher.students),
    __metadata("design:type", Array)
], Student.prototype, "teachers", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => lesson_entity_1.Lesson, (lesson) => lesson.students),
    __metadata("design:type", Array)
], Student.prototype, "lessons", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => revenues_entity_1.Revenue, (revenue) => revenue.student),
    __metadata("design:type", Array)
], Student.prototype, "revenues", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => installment_entity_1.Installment, (installment) => installment.student, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Student.prototype, "installments", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', array: false, default: [] }),
    __metadata("design:type", Array)
], Student.prototype, "activities", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lesson_attendance_entity_1.LessonAttendance, (attendance) => attendance.student),
    __metadata("design:type", Array)
], Student.prototype, "attendances", void 0);
exports.Student = Student = __decorate([
    (0, typeorm_1.Entity)('students')
], Student);
//# sourceMappingURL=student.entity.js.map