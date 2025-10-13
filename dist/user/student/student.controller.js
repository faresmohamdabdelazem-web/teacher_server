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
exports.StudentController = void 0;
const common_1 = require("@nestjs/common");
const student_service_1 = require("./student.service");
const create_student_dto_1 = require("./create-student.dto");
const whatsapp_service_1 = require("../../notification/whatsapp.service");
const auth_guard_1 = require("../../auth/guard/auth.guard");
const role_guard_1 = require("../../auth/guard/role.guard");
const role_decorator_1 = require("../../decorators/role.decorator");
const user_role_enum_1 = require("../user.role.enum");
const pay_installment_dto_1 = require("../../Installment/dto/pay-installment.dto");
let StudentController = class StudentController {
    constructor(studentService, whatsAppService) {
        this.studentService = studentService;
        this.whatsAppService = whatsAppService;
    }
    create(createStudentDto) {
        return this.studentService.create(createStudentDto);
    }
    payInstallment(id, payInstallmentDto) {
        return this.studentService.payInstallment(id, payInstallmentDto);
    }
    findAll(branchId, sectionId, isLate) {
        return this.studentService.findAll(branchId, sectionId, isLate);
    }
    findAllName() {
        return this.studentService.findAll();
    }
    findOne(id) {
        return this.studentService.findOne(id);
    }
    findByPhoneNumber(phoneNumber) {
        return this.studentService.findByPhoneNumber(phoneNumber);
    }
    findByManualEntryId(manualEntryId) {
        return this.studentService.findByManualEntryId(manualEntryId);
    }
    update(id, updateStudentDto) {
        return this.studentService.update(id, updateStudentDto);
    }
    remove(id) {
        return this.studentService.remove(id);
    }
    getStudentTeachers(id) {
        return this.studentService.getStudentTeachers(id);
    }
    getStudentLessons(id) {
        return this.studentService.getStudentLessons(id);
    }
    async sendBarcodeToPhone(body) {
        const { phoneNumber, base64Image } = body;
        const to = phoneNumber.startsWith('+') ? phoneNumber : `+2${phoneNumber}`;
        const result = await this.whatsAppService.sendImageBarcode(to, base64Image);
        return { success: result, message: 'Barcode sent successfully' };
    }
};
exports.StudentController = StudentController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_student_dto_1.CreateStudentDto]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/pay'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pay_installment_dto_1.PayInstallmentDto]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "payInstallment", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('sectionId')),
    __param(2, (0, common_1.Query)('isLate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("name"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "findAllName", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('phoneNumber/:phoneNumber'),
    __param(0, (0, common_1.Param)('phoneNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "findByPhoneNumber", null);
__decorate([
    (0, common_1.Get)('manualEntryId/:manualEntryId'),
    __param(0, (0, common_1.Param)('manualEntryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "findByManualEntryId", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/teachers'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "getStudentTeachers", null);
__decorate([
    (0, common_1.Get)(':id/lessons'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "getStudentLessons", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    (0, common_1.Post)('send-barcode'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "sendBarcodeToPhone", null);
exports.StudentController = StudentController = __decorate([
    (0, common_1.Controller)('students'),
    __metadata("design:paramtypes", [student_service_1.StudentService,
        whatsapp_service_1.WhatsAppService])
], StudentController);
//# sourceMappingURL=student.controller.js.map