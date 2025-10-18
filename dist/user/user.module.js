"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModule = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user.service");
const user_controller_1 = require("./user.controller");
const cloudinary_module_1 = require("../cloudinary/cloudinary.module");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./entities/user.entity");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const user_repository_1 = require("./user.repository");
const teacher_entity_1 = require("./teacher/teacher.entity");
const student_entity_1 = require("./student/student.entity");
const assistant_entity_1 = require("./assistant/assistant.entity");
const lesson_entity_1 = require("../lesson/entities/lesson.entity");
const lesson_attendance_entity_1 = require("../lesson/entities/lesson-attendance.entity");
const teacher_service_1 = require("./teacher/teacher.service");
const student_service_1 = require("./student/student.service");
const assistant_service_1 = require("./assistant/assistant.service");
const teacher_controller_1 = require("./teacher/teacher.controller");
const student_controller_1 = require("./student/student.controller");
const auth_module_1 = require("../auth/auth.module");
const notification_module_1 = require("../notification/notification.module");
const whatsapp_service_1 = require("../notification/whatsapp.service");
const installment_module_1 = require("../Installment/installment.module");
const installment_entity_1 = require("../Installment/entities/installment.entity");
const branch_entity_1 = require("../branch/entities/branch.entity");
const section_module_1 = require("../section/section.module");
const section_entity_1 = require("../section/entities/section.entity");
const branch_module_1 = require("../branch/branch.module");
const revenue_module_1 = require("../revenues/revenue.module");
const revenues_entity_1 = require("../revenues/entities/revenues.entity");
const lesson_module_1 = require("../lesson/lesson.module");
let UserModule = class UserModule {
};
exports.UserModule = UserModule;
exports.UserModule = UserModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                teacher_entity_1.Teacher,
                student_entity_1.Student,
                assistant_entity_1.Assistant,
                branch_entity_1.Branch,
                section_entity_1.Section,
                lesson_entity_1.Lesson,
                revenues_entity_1.Revenue,
                lesson_attendance_entity_1.LessonAttendance,
                installment_entity_1.Installment,
            ]),
            cloudinary_module_1.CloudinaryModule,
            installment_module_1.InstallmentModule,
            notification_module_1.NotificationModule,
            revenue_module_1.RevenueModule,
            section_module_1.SectionModule,
            branch_module_1.BranchModule,
            (0, common_1.forwardRef)(() => lesson_module_1.LessonModule),
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
        ],
        controllers: [
            user_controller_1.UserController,
            teacher_controller_1.TeacherController,
            student_controller_1.StudentController,
        ],
        providers: [
            user_service_1.UserService,
            cloudinary_service_1.CloudinaryService,
            user_repository_1.UserRepository,
            teacher_service_1.TeacherService,
            student_service_1.StudentService,
            assistant_service_1.AssistantService,
            whatsapp_service_1.WhatsAppService,
        ],
        exports: [
            user_service_1.UserService,
            user_repository_1.UserRepository,
            teacher_service_1.TeacherService,
            student_service_1.StudentService,
            assistant_service_1.AssistantService,
            whatsapp_service_1.WhatsAppService,
        ],
    })
], UserModule);
//# sourceMappingURL=user.module.js.map