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
exports.TeacherController = void 0;
const common_1 = require("@nestjs/common");
const teacher_service_1 = require("./teacher.service");
const create_teacher_dto_1 = require("./create-teacher.dto");
const auth_guard_1 = require("../../auth/guard/auth.guard");
const role_guard_1 = require("../../auth/guard/role.guard");
const user_role_enum_1 = require("../user.role.enum");
const role_decorator_1 = require("../../decorators/role.decorator");
const user_service_1 = require("../user.service");
const get_signed_user_decorator_1 = require("../../decorators/get.signed.user.decorator");
const create_user_dto_1 = require("../dto/create-user.dto");
const assistant_service_1 = require("../assistant/assistant.service");
let TeacherController = class TeacherController {
    constructor(teacherService, userService, assistantService) {
        this.teacherService = teacherService;
        this.userService = userService;
        this.assistantService = assistantService;
    }
    create(createTeacherDto, user) {
        return this.teacherService.create(createTeacherDto, user);
    }
    findAll() {
        return this.teacherService.findAll();
    }
    findOne(id) {
        return this.teacherService.findOne(id);
    }
    getTeacherStudents(id) {
        return this.teacherService.getTeacherStudents(id);
    }
    getTeacherLessons(id) {
        return this.teacherService.getTeacherLessons(id);
    }
    async getTeacherAssistants(id, user) {
        const currentUser = await this.userService.findOneById(user.id);
        if (!currentUser || (currentUser.role !== user_role_enum_1.UserRole.ADMIN && currentUser.userId !== id)) {
            throw new Error('Unauthorized to view these assistants');
        }
        const assistants = await this.assistantService.findByTeacher(id);
        return {
            assistants: assistants.map(assistant => ({
                id: assistant.userId,
                firstName: assistant.user.firstName,
                lastName: assistant.user.lastName,
                email: assistant.user.email,
                phone: assistant.user.phone,
                role: assistant.user.role,
                createdAt: assistant.createdAt,
                teacherId: assistant.teacherId,
            })),
        };
    }
    update(id, updateTeacherDto) {
        return this.teacherService.update(id, updateTeacherDto);
    }
    remove(id) {
        return this.teacherService.remove(id);
    }
    async createAssistant(createAssistantData, user) {
        const currentUser = await this.userService.findOneById(user.id);
        if (!currentUser || currentUser.role !== user_role_enum_1.UserRole.TEACHER) {
            throw new Error('Only teachers can create assistants');
        }
        const assistant = await this.userService.create({
            ...createAssistantData,
            role: user_role_enum_1.UserRole.ASSISTANT,
        });
        const assistantEntity = await this.assistantService.createWithUserAndTeacher(assistant, currentUser.userId);
        return {
            message: 'Assistant created successfully by teacher',
            assistant: {
                id: assistant.userId,
                firstName: assistant.firstName,
                lastName: assistant.lastName,
                email: assistant.email,
                role: assistant.role,
                phone: assistant.phone,
                createdAt: assistant.createdAt,
                teacherId: assistantEntity.teacherId,
            },
        };
    }
};
exports.TeacherController = TeacherController;
__decorate([
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_teacher_dto_1.CreateTeacherDto, Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "create", null);
__decorate([
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "findAll", null);
__decorate([
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.TEACHER),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "findOne", null);
__decorate([
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    (0, common_1.Get)(':id/students'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getTeacherStudents", null);
__decorate([
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    (0, common_1.Get)(':id/lessons'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getTeacherLessons", null);
__decorate([
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.TEACHER),
    (0, common_1.Get)(':id/assistants'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "getTeacherAssistants", null);
__decorate([
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.TEACHER),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "update", null);
__decorate([
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('create-assistant'),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "createAssistant", null);
exports.TeacherController = TeacherController = __decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Controller)('teachers'),
    __metadata("design:paramtypes", [teacher_service_1.TeacherService,
        user_service_1.UserService,
        assistant_service_1.AssistantService])
], TeacherController);
//# sourceMappingURL=teacher.controller.js.map