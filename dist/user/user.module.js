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
const stripe_module_1 = require("../stripe/stripe.module");
const teacher_entity_1 = require("./teacher/teacher.entity");
const student_entity_1 = require("./student/student.entity");
const assistant_entity_1 = require("./assistant/assistant.entity");
const lesson_entity_1 = require("../lesson/entities/lesson.entity");
const teacher_service_1 = require("./teacher/teacher.service");
const student_service_1 = require("./student/student.service");
const assistant_service_1 = require("./assistant/assistant.service");
const teacher_controller_1 = require("./teacher/teacher.controller");
const student_controller_1 = require("./student/student.controller");
const auth_module_1 = require("../auth/auth.module");
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
                lesson_entity_1.Lesson,
            ]),
            cloudinary_module_1.CloudinaryModule,
            stripe_module_1.StripeModule,
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
        ],
        exports: [
            user_service_1.UserService,
            user_repository_1.UserRepository,
            teacher_service_1.TeacherService,
            student_service_1.StudentService,
            assistant_service_1.AssistantService,
        ],
    })
], UserModule);
//# sourceMappingURL=user.module.js.map