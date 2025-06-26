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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const sign_in_dto_1 = require("./dto/sign-in.dto");
const check_jwt_dto_1 = require("./dto/check.jwt.dto");
const send_email_dto_1 = require("./dto/send-email.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const register_dto_1 = require("./dto/register.dto");
const google_auth_service_1 = require("./google-auth.service");
const auth_google_dto_1 = require("./dto/auth-google.dto");
let AuthController = class AuthController {
    constructor(authService, googleService) {
        this.authService = authService;
        this.googleService = googleService;
    }
    signIn(signInDto) {
        return this.authService.signIn(signInDto);
    }
    register(registerDto) {
        return this.authService.signUp(registerDto);
    }
    sendEmail(sendEmailDto) {
        return this.authService.sendForgetPassEmail(sendEmailDto);
    }
    async check(body, req) {
        return this.authService.checkAccessToken(body.token);
    }
    resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(+resetPasswordDto.otp, resetPasswordDto.newPassword);
    }
    googleAuth(authGoogleDto) {
        return this.authService.googleLogin(authGoogleDto);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('sign-in'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sign_in_dto_1.SignInDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signIn", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('send-email'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_email_dto_1.SendEmailDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Post)('/check'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_jwt_dto_1.CheckJwtDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "check", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('google'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_google_dto_1.SocialLoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleAuth", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        google_auth_service_1.AuthGoogleService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map