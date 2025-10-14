"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const student_service_1 = require("./student.service");
const student_controller_1 = require("./student.controller");
const student_entity_1 = require("./student.entity");
const cloudinary_module_1 = require("../../cloudinary/cloudinary.module");
const notification_module_1 = require("../../notification/notification.module");
const installment_module_1 = require("../../Installment/installment.module");
const lesson_module_1 = require("../../lesson/lesson.module");
const lesson_attendance_entity_1 = require("../../lesson/entities/lesson-attendance.entity");
const section_module_1 = require("../../section/section.module");
const branch_module_1 = require("../../branch/branch.module");
const section_entity_1 = require("../../section/entities/section.entity");
const branch_entity_1 = require("../../branch/entities/branch.entity");
const revenue_module_1 = require("../../revenues/revenue.module");
const installment_entity_1 = require("../../Installment/entities/installment.entity");
const assistant_1 = require("../assistant");
let StudentModule = class StudentModule {
};
exports.StudentModule = StudentModule;
exports.StudentModule = StudentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([student_entity_1.Student, section_entity_1.Section, branch_entity_1.Branch, installment_entity_1.Installment, lesson_attendance_entity_1.LessonAttendance, assistant_1.Assistant]),
            section_module_1.SectionModule,
            branch_module_1.BranchModule,
            revenue_module_1.RevenueModule,
            cloudinary_module_1.CloudinaryModule,
            notification_module_1.NotificationModule,
            (0, common_1.forwardRef)(() => lesson_module_1.LessonModule),
            installment_module_1.InstallmentModule,
        ],
        controllers: [student_controller_1.StudentController],
        providers: [student_service_1.StudentService],
        exports: [student_service_1.StudentService],
    })
], StudentModule);
//# sourceMappingURL=student.module.js.map