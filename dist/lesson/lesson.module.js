"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const lesson_controller_1 = require("./lesson.controller");
const lesson_service_1 = require("./lesson.service");
const lesson_entity_1 = require("./entities/lesson.entity");
const lesson_attendance_entity_1 = require("./entities/lesson-attendance.entity");
const teacher_stats_entity_1 = require("./entities/teacher-stats.entity");
const teacher_stats_service_1 = require("./teacher-stats.service");
const teacher_entity_1 = require("../user/teacher/teacher.entity");
const student_entity_1 = require("../user/student/student.entity");
const user_module_1 = require("../user/user.module");
const notification_module_1 = require("../notification/notification.module");
const student_module_1 = require("../user/student/student.module");
const installment_entity_1 = require("../Installment/entities/installment.entity");
const assistant_entity_1 = require("../user/assistant/assistant.entity");
const section_entity_1 = require("../section/entities/section.entity");
let LessonModule = class LessonModule {
};
exports.LessonModule = LessonModule;
exports.LessonModule = LessonModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([lesson_entity_1.Lesson, lesson_attendance_entity_1.LessonAttendance, teacher_entity_1.Teacher, student_entity_1.Student, teacher_stats_entity_1.TeacherStats, installment_entity_1.Installment, assistant_entity_1.Assistant, section_entity_1.Section]),
            (0, common_1.forwardRef)(() => user_module_1.UserModule),
            notification_module_1.NotificationModule,
            (0, common_1.forwardRef)(() => student_module_1.StudentModule)
        ],
        controllers: [lesson_controller_1.LessonController],
        providers: [lesson_service_1.LessonService, teacher_stats_service_1.TeacherStatsService],
        exports: [lesson_service_1.LessonService, teacher_stats_service_1.TeacherStatsService],
    })
], LessonModule);
//# sourceMappingURL=lesson.module.js.map