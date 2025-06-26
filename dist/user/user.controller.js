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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const auth_guard_1 = require("../auth/guard/auth.guard");
const role_guard_1 = require("../auth/guard/role.guard");
const role_decorator_1 = require("../decorators/role.decorator");
const user_role_enum_1 = require("./user.role.enum");
const get_signed_user_decorator_1 = require("../decorators/get.signed.user.decorator");
const update_user_dto_1 = require("./dto/update-user.dto");
const filter_user_dto_1 = require("./dto/filter-user.dto");
const phone_number_pipe_1 = require("../shared/phone-number.pipe");
const change_password_dto_1 = require("./dto/change-password.dto");
const student_service_1 = require("./student/student.service");
const create_student_dto_1 = require("./student/create-student.dto");
const teacher_service_1 = require("./teacher/teacher.service");
const assistant_service_1 = require("./assistant/assistant.service");
let UserController = class UserController {
    constructor(userService, studentService, teacherService, assistantService) {
        this.userService = userService;
        this.studentService = studentService;
        this.teacherService = teacherService;
        this.assistantService = assistantService;
    }
    create(createUserDto) {
        return this.userService.create(createUserDto);
    }
    findAll(paginatedRequestDto) {
        return this.userService.findAll(paginatedRequestDto);
    }
    findOne(id) {
        return this.userService.findOne(id);
    }
    update(id, user, updateUserDto) {
        return this.userService.update(id, updateUserDto, user);
    }
    remove(id) {
        return this.userService.remove(id);
    }
    async changePassword(changePasswordDto, user) {
        return this.userService.changePassword(changePasswordDto, user.id);
    }
    async createStudentByAssistant(createStudentData, user) {
        const currentUser = await this.userService.findOneById(user.id);
        if (!currentUser || currentUser.role !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new Error('Only assistants can create students');
        }
        const student = await this.studentService.create({
            firstName: createStudentData.firstName,
            lastName: createStudentData.lastName,
            phoneNumber: createStudentData.phoneNumber,
            parentPhoneNumber: createStudentData.parentPhoneNumber,
        });
        const assistant = await this.assistantService.findByUserId(currentUser.userId);
        if (assistant && assistant.teacherId) {
            await this.teacherService.addStudentToTeacher(assistant.teacherId, student.id);
        }
        return {
            message: 'Student created successfully by assistant',
            student: {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                phoneNumber: student.phoneNumber,
                parentPhoneNumber: student.parentPhoneNumber,
                createdAt: student.createdAt,
                updatedAt: student.updatedAt,
            },
        };
    }
    async createTeacherByAdmin(createTeacherData) {
        const user = await this.userService.create({
            ...createTeacherData,
            role: user_role_enum_1.UserRole.TEACHER,
        });
        const teacher = await this.teacherService.createWithUser(user);
        return {
            message: 'Teacher created successfully by admin',
            user,
            teacher,
        };
    }
    async createAssistantByAdmin(createAssistantData) {
        const user = await this.userService.create({
            ...createAssistantData,
            role: user_role_enum_1.UserRole.ASSISTANT,
        });
        const assistant = await this.assistantService.createWithUser(user);
        return {
            message: 'Assistant created successfully by admin',
            user,
            assistant,
        };
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    (0, common_1.UsePipes)(new phone_number_pipe_1.PhoneNumberPipe()),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_user_dto_1.FilterUsersDto]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.CUSTOMER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.CUSTOMER),
    (0, common_1.UsePipes)(new phone_number_pipe_1.PhoneNumberPipe()),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)('/reset/password'),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.CUSTOMER),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [change_password_dto_1.ChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('assistant/create-student'),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_student_dto_1.CreateStudentDto, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "createStudentByAssistant", null);
__decorate([
    (0, common_1.Post)('admin/create-teacher'),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "createTeacherByAdmin", null);
__decorate([
    (0, common_1.Post)('admin/create-assistant'),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "createAssistantByAdmin", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('user'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [user_service_1.UserService,
        student_service_1.StudentService,
        teacher_service_1.TeacherService,
        assistant_service_1.AssistantService])
], UserController);
//# sourceMappingURL=user.controller.js.map