import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGoogleService } from './google-auth.service';
import { SocialLoginDto } from './dto/auth-google.dto';
export declare class AuthController {
    private readonly authService;
    private readonly googleService;
    constructor(authService: AuthService, googleService: AuthGoogleService);
    signIn(signInDto: SignInDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("../user/entities/user.entity").User;
    }>;
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("../user/entities/user.entity").User;
    }>;
    sendEmail(sendEmailDto: SendEmailDto): Promise<void>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        status: boolean;
    }>;
    googleAuth(authGoogleDto: SocialLoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("../user/entities/user.entity").User;
    }>;
    logout(user: any): Promise<void>;
}
