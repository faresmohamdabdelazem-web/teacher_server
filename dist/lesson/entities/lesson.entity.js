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
exports.Lesson = exports.LessonStatus = exports.LessonRecurrenceType = void 0;
const typeorm_1 = require("typeorm");
const teacher_entity_1 = require("../../user/teacher/teacher.entity");
const student_entity_1 = require("../../user/student/student.entity");
var LessonRecurrenceType;
(function (LessonRecurrenceType) {
    LessonRecurrenceType["NONE"] = "none";
    LessonRecurrenceType["DAILY"] = "daily";
    LessonRecurrenceType["WEEKLY"] = "weekly";
    LessonRecurrenceType["MONTHLY"] = "monthly";
})(LessonRecurrenceType || (exports.LessonRecurrenceType = LessonRecurrenceType = {}));
var LessonStatus;
(function (LessonStatus) {
    LessonStatus["SCHEDULED"] = "scheduled";
    LessonStatus["ATTENDANCE_OPEN"] = "attendance_open";
    LessonStatus["IN_PROGRESS"] = "in_progress";
    LessonStatus["COMPLETED"] = "completed";
    LessonStatus["CANCELLED"] = "cancelled";
})(LessonStatus || (exports.LessonStatus = LessonStatus = {}));
let Lesson = class Lesson {
};
exports.Lesson = Lesson;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Lesson.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Lesson.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Lesson.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Lesson.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Lesson.prototype, "scheduledDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Lesson.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Lesson.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Lesson.prototype, "attendanceStartTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lesson.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: LessonRecurrenceType,
        default: LessonRecurrenceType.NONE
    }),
    __metadata("design:type", String)
], Lesson.prototype, "recurrenceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Lesson.prototype, "recurrencePattern", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: LessonStatus,
        default: LessonStatus.SCHEDULED
    }),
    __metadata("design:type", String)
], Lesson.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Lesson.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Lesson.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Lesson.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, (teacher) => teacher.lessons),
    __metadata("design:type", teacher_entity_1.Teacher)
], Lesson.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => student_entity_1.Student, (student) => student.lessons),
    (0, typeorm_1.JoinTable)({
        name: 'lesson_students',
        joinColumn: { name: 'lessonId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'studentId', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Lesson.prototype, "students", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', nullable: true }),
    __metadata("design:type", Number)
], Lesson.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lesson.prototype, "grade", void 0);
exports.Lesson = Lesson = __decorate([
    (0, typeorm_1.Entity)('lessons')
], Lesson);
//# sourceMappingURL=lesson.entity.js.map