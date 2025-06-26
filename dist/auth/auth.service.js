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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const user_service_1 = require("../user/user.service");
const helper_1 = require("../decorators/password/helper");
const config_1 = require("@nestjs/config");
const mail_service_1 = require("../mail/mail.service");
const crypto_1 = require("crypto");
const hatly_constants_1 = require("../hatly.constants");
const google_auth_service_1 = require("./google-auth.service");
const user_role_enum_1 = require("../user/user.role.enum");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const teacher_service_1 = require("../user/teacher/teacher.service");
const student_service_1 = require("../user/student/student.service");
const assistant_service_1 = require("../user/assistant/assistant.service");
let AuthService = class AuthService {
    constructor(jwtService, userService, configService, cloudinary, mailService, googleAuthService, teacherService, studentService, assistantService) {
        this.jwtService = jwtService;
        this.userService = userService;
        this.configService = configService;
        this.cloudinary = cloudinary;
        this.mailService = mailService;
        this.googleAuthService = googleAuthService;
        this.teacherService = teacherService;
        this.studentService = studentService;
        this.assistantService = assistantService;
    }
    async signIn(signInDto) {
        const { email, password } = signInDto;
        console.log('Login attempt for email:', email);
        const user = await this.userService.findOneByEmail(email);
        console.log('Found user:', user ? 'yes' : 'no');
        if (!user) {
            console.log('user not found');
            throw new common_1.UnauthorizedException('Email or password is not correct');
        }
        console.log('Comparing passwords...');
        console.log('Input password:', password);
        console.log('Stored hash:', user.password);
        const isPasswordValid = await (0, helper_1.comparePassword)(password, user.password);
        console.log('Password comparison result:', isPasswordValid);
        if (!isPasswordValid) {
            console.log('password not correct');
            throw new common_1.UnauthorizedException('Email or password is not correct');
        }
        return this.generateAndStoreTokens(user);
    }
    async signUp(createUser) {
        console.log('Registration attempt for email:', createUser.email);
        console.log('Password before hashing:', createUser.password);
        const user = await this.userService.create(createUser);
        console.log('User created with hashed password:', user.password);
        return this.generateAndStoreTokens(user);
    }
    async googleLogin(authGoogleLoginDto) {
        try {
            const googleData = await this.googleAuthService.fetchProfileByToken(authGoogleLoginDto.idToken);
            const userExist = await this.userService.findOneByEmail(googleData.email);
            if (userExist) {
                await this.updateUserHandler(googleData, userExist);
                return this.generateAndStoreTokens(userExist);
            }
            const user = await this.userService.create({
                email: googleData.email,
                firstName: googleData.given_name,
                lastName: googleData.family_name,
                profilePhoto: googleData.picture,
                role: user_role_enum_1.UserRole.CUSTOMER,
            });
            return this.generateAndStoreTokens(user);
        }
        catch (error) {
            throw new common_1.UnauthorizedException(error);
        }
    }
    async updateUserHandler(newData, user) {
        if (newData.given_name != user.firstName) {
            user.firstName = newData.given_name;
            await this.userService.update(user.userId, {
                firstName: newData.given_name,
            }, null);
        }
        if (newData.family_name != user.lastName) {
            user.lastName = newData.family_name;
            await this.userService.update(user.userId, {
                lastName: newData.family_name,
            }, null);
        }
    }
    async checkAccessToken(token) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('ACCESS_TOKEN_SECRET'),
            });
            const user = await this.userService.findOneById(payload.userId);
            if (!user) {
                throw new common_1.UnauthorizedException('Invalid Token');
            }
            let userWithTeacherInfo = user;
            if (user.role === user_role_enum_1.UserRole.ASSISTANT) {
                const assistant = await this.assistantService.findByUserId(user.userId);
                if (assistant) {
                    userWithTeacherInfo = {
                        ...user,
                        teacherId: assistant.teacherId,
                    };
                }
            }
            return { status: true, user: userWithTeacherInfo };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid Token');
        }
    }
    async sendForgetPassEmail(sendEmail) {
        const user = await this.userService.findOneByEmail(sendEmail.email);
        if (!user) {
            throw new common_1.NotFoundException('Email not found');
        }
        if (user.password == null) {
            throw new common_1.NotFoundException('This email not allowed to this operation');
        }
        const otp = this.generateOTP();
        user.otpToken = otp;
        user.otpExp = hatly_constants_1.OTP_TOKEN_EXPIRE;
        await this.userService.update(user.userId, user, null);
        const finalPath = sendEmail.ar ? hatly_constants_1.FORGET_PASS_AR : hatly_constants_1.FORGET_PASS_EN;
        this.mailService.sendEmail(user.email, 'Forget Password', finalPath, {
            otp,
        });
        return;
    }
    async checkOtp(otp) {
        return (await this.userService.isValidOtp(otp)) ? true : false;
    }
    async resetPassword(otp, password) {
        const user = await this.userService.isValidOtp(otp.toString());
        if (!user) {
            throw new common_1.NotFoundException('OTP not found');
        }
        user.otpToken = null;
        user.otpExp = null;
        user.password = password;
        await this.userService.update(user.userId, user, null);
        return { status: true };
    }
    generateOTP() {
        const randomNumber = (0, crypto_1.randomInt)(0, 9999);
        return randomNumber.toString().padStart(4, '0');
    }
    async generateAccessToken(user) {
        let payload = { userId: user.userId, role: user.role, email: user.email };
        if (user.role === user_role_enum_1.UserRole.ASSISTANT) {
            const assistant = await this.assistantService.findByUserId(user.userId);
            if (assistant) {
                payload.teacherId = assistant.teacherId;
            }
        }
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('ACCESS_TOKEN_SECRET'),
            expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN'),
        });
        return accessToken;
    }
    getSignature(token) {
        return token.split('.')[2];
    }
    async generateAndStoreTokens(user) {
        const accessToken = await this.generateAccessToken(user);
        let userWithTeacherInfo = user;
        if (user.role === user_role_enum_1.UserRole.ASSISTANT) {
            const assistant = await this.assistantService.findByUserId(user.userId);
            if (assistant) {
                userWithTeacherInfo = {
                    ...user,
                    teacherId: assistant.teacherId,
                };
            }
        }
        return {
            accessToken,
            user: userWithTeacherInfo,
        };
    }
    async createStudentByAssistant(createStudentDto, id) {
        const user = await this.userService.findOneById(id);
        if (!user || user.role !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.ForbiddenException('Only assistants can create students');
        }
        const student = await this.studentService.create({
            firstName: createStudentDto.firstName,
            lastName: createStudentDto.lastName,
            phoneNumber: createStudentDto.phoneNumber,
            parentPhoneNumber: createStudentDto.parentPhoneNumber,
        });
        return {
            message: 'Student created successfully by assistant',
            student: {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                phoneNumber: student.phoneNumber,
                parentPhoneNumber: student.parentPhoneNumber,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => user_service_1.UserService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        user_service_1.UserService,
        config_1.ConfigService,
        cloudinary_service_1.CloudinaryService,
        mail_service_1.MailService,
        google_auth_service_1.AuthGoogleService,
        teacher_service_1.TeacherService,
        student_service_1.StudentService,
        assistant_service_1.AssistantService])
], AuthService);
//# sourceMappingURL=auth.service.js.map