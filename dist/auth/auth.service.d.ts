import { User } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/sign-in.dto';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { SendEmailDto } from './dto/send-email.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGoogleService } from './google-auth.service';
import { SocialLoginDto } from './dto/auth-google.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { TeacherService } from 'src/user/teacher/teacher.service';
import { StudentService } from 'src/user/student/student.service';
import { CreateStudentDto } from 'src/user/student/create-student.dto';
import { AssistantService } from 'src/user/assistant/assistant.service';
export declare class AuthService {
    private readonly jwtService;
    private readonly userService;
    private configService;
    private cloudinary;
    private mailService;
    private readonly googleAuthService;
    private readonly teacherService;
    private readonly studentService;
    private readonly assistantService;
    constructor(jwtService: JwtService, userService: UserService, configService: ConfigService, cloudinary: CloudinaryService, mailService: MailService, googleAuthService: AuthGoogleService, teacherService: TeacherService, studentService: StudentService, assistantService: AssistantService);
    signIn(signInDto: SignInDto): Promise<{
        accessToken: string;
        user: User;
    }>;
    signUp(createUser: RegisterDto): Promise<{
        accessToken: string;
        user: User;
    }>;
    googleLogin(authGoogleLoginDto: SocialLoginDto): Promise<{
        accessToken: string;
        user: User;
    }>;
    private updateUserHandler;
    checkAccessToken(token: string): Promise<{
        status: boolean;
        user: User;
    }>;
    sendForgetPassEmail(sendEmail: SendEmailDto): Promise<void>;
    checkOtp(otp: string): Promise<boolean>;
    resetPassword(otp: number, password: string): Promise<{
        status: boolean;
    }>;
    private generateOTP;
    private generateAccessToken;
    private getSignature;
    private generateAndStoreTokens;
    createStudentByAssistant(createStudentDto: CreateStudentDto, id: string): Promise<{
        message: string;
        student: {
            id: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
            parentPhoneNumber: string;
        };
    }>;
}
