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
exports.LessonController = void 0;
const common_1 = require("@nestjs/common");
const lesson_service_1 = require("./lesson.service");
const create_lesson_dto_1 = require("./dto/create-lesson.dto");
const unsubscribe_lesson_dto_1 = require("./dto/unsubscribe-lesson.dto");
const add_student_to_lesson_dto_1 = require("./dto/add-student-to-lesson.dto");
const remove_student_from_lesson_dto_1 = require("./dto/remove-student-from-lesson.dto");
const mark_attendance_dto_1 = require("./dto/mark-attendance.dto");
const auth_guard_1 = require("../auth/guard/auth.guard");
const role_guard_1 = require("../auth/guard/role.guard");
const user_role_enum_1 = require("../user/user.role.enum");
const role_decorator_1 = require("../decorators/role.decorator");
const get_signed_user_decorator_1 = require("../decorators/get.signed.user.decorator");
let LessonController = class LessonController {
    constructor(lessonService) {
        this.lessonService = lessonService;
    }
    create(createLessonDto, user) {
        return this.lessonService.create(createLessonDto, user.id, user.role);
    }
    findAll() {
        return this.lessonService.findAll();
    }
    findBySubject(subject) {
        return this.lessonService.findBySubject(subject);
    }
    getLessonsByTeacher(teacherId) {
        return this.lessonService.getLessonsByTeacher(teacherId);
    }
    getLessonsByDate(date) {
        return this.lessonService.getLessonsByDate(date);
    }
    findOne(id) {
        return this.lessonService.findOne(id);
    }
    getLessonStudents(id) {
        return this.lessonService.getLessonStudents(id);
    }
    startAttendance(lessonId, user) {
        return this.lessonService.startAttendance({ lessonId }, user.id, user.role);
    }
    markAttendance(markAttendanceDto, user) {
        return this.lessonService.markAttendance(markAttendanceDto, user.id, user.role);
    }
    getLessonAttendance(lessonId) {
        return this.lessonService.getLessonAttendance(lessonId);
    }
    getStudentAttendanceHistory(studentId) {
        return this.lessonService.getStudentAttendanceHistory(studentId);
    }
    startLesson(lessonId, user) {
        return this.lessonService.startLesson(lessonId, user.id, user.role);
    }
    completeLesson(lessonId, user) {
        return this.lessonService.completeLesson(lessonId, user.id, user.role);
    }
    reopenLesson(lessonId, user) {
        return this.lessonService.reopenLesson(lessonId, user.id, user.role);
    }
    getUpcomingLessons() {
        return this.lessonService.getUpcomingLessons();
    }
    getCompletedLessons() {
        return this.lessonService.getCompletedLessons();
    }
    update(id, updateLessonDto, user) {
        return this.lessonService.update(id, updateLessonDto, user.id, user.role);
    }
    remove(id, user) {
        return this.lessonService.remove(id, user.id, user.role);
    }
    addStudentToLesson(addStudentDto, user) {
        return this.lessonService.addStudentToLesson(addStudentDto.lessonId, addStudentDto.studentId, user.id, user.role);
    }
    removeStudentFromLesson(removeStudentDto, user) {
        return this.lessonService.removeStudentFromLesson(removeStudentDto.lessonId, removeStudentDto.studentId, user.id, user.role);
    }
    unsubscribeFromLesson(unsubscribeDto) {
        return this.lessonService.unsubscribeFromLesson(unsubscribeDto);
    }
    getStudentSubscriptions(studentId) {
        return this.lessonService.getStudentSubscriptions(studentId);
    }
    checkStudentSubscription(studentId, lessonId) {
        return this.lessonService.checkStudentSubscription(studentId, lessonId);
    }
};
exports.LessonController = LessonController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lesson_dto_1.CreateLessonDto, Object]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('subject/:subject'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Param)('subject')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "findBySubject", null);
__decorate([
    (0, common_1.Get)('teacher/:teacherId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Param)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "getLessonsByTeacher", null);
__decorate([
    (0, common_1.Get)('date/:date'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Param)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "getLessonsByDate", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/students'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT, user_role_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "getLessonStudents", null);
__decorate([
    (0, common_1.Post)(':id/start-attendance'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "startAttendance", null);
__decorate([
    (0, common_1.Post)('mark-attendance'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mark_attendance_dto_1.MarkAttendanceDto, Object]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "markAttendance", null);
__decorate([
    (0, common_1.Get)(':id/attendance'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT, user_role_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "getLessonAttendance", null);
__decorate([
    (0, common_1.Get)('student/:studentId/attendance-history'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT, user_role_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "getStudentAttendanceHistory", null);
__decorate([
    (0, common_1.Post)(':id/start-lesson'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "startLesson", null);
__decorate([
    (0, common_1.Post)(':id/complete-lesson'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "completeLesson", null);
__decorate([
    (0, common_1.Post)(':id/reopen-lesson'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "reopenLesson", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "getUpcomingLessons", null);
__decorate([
    (0, common_1.Get)('completed'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "getCompletedLessons", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('add-student'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [add_student_to_lesson_dto_1.AddStudentToLessonDto, Object]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "addStudentToLesson", null);
__decorate([
    (0, common_1.Post)('remove-student'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.ASSISTANT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_signed_user_decorator_1.GetSignedUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [remove_student_from_lesson_dto_1.RemoveStudentFromLessonDto, Object]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "removeStudentFromLesson", null);
__decorate([
    (0, common_1.Post)('unsubscribe'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [unsubscribe_lesson_dto_1.UnsubscribeLessonDto]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "unsubscribeFromLesson", null);
__decorate([
    (0, common_1.Get)('student/:studentId/subscriptions'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT, user_role_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "getStudentSubscriptions", null);
__decorate([
    (0, common_1.Get)('student/:studentId/lesson/:lessonId/check-subscription'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ASSISTANT, user_role_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Param)('lessonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LessonController.prototype, "checkStudentSubscription", null);
exports.LessonController = LessonController = __decorate([
    (0, common_1.Controller)('lessons'),
    __metadata("design:paramtypes", [lesson_service_1.LessonService])
], LessonController);
//# sourceMappingURL=lesson.controller.js.map