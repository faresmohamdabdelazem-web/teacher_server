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
exports.Teacher = void 0;
const typeorm_1 = require("typeorm");
const lesson_entity_1 = require("../../lesson/entities/lesson.entity");
const student_entity_1 = require("../student/student.entity");
const user_entity_1 = require("../entities/user.entity");
let Teacher = class Teacher {
};
exports.Teacher = Teacher;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], Teacher.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], Teacher.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Teacher.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Teacher.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lesson_entity_1.Lesson, (lesson) => lesson.teacher),
    __metadata("design:type", Array)
], Teacher.prototype, "lessons", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => student_entity_1.Student, (student) => student.teachers),
    (0, typeorm_1.JoinTable)({
        name: 'teacher_students',
        joinColumn: { name: 'teacherId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'studentId', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Teacher.prototype, "students", void 0);
exports.Teacher = Teacher = __decorate([
    (0, typeorm_1.Entity)('teachers')
], Teacher);
//# sourceMappingURL=teacher.entity.js.map