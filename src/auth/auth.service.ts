import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
  ForbiddenException,
} from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/sign-in.dto';
import { UserService } from 'src/user/user.service';
import { comparePassword } from 'src/decorators/password/helper';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { SendEmailDto } from './dto/send-email.dto';
import { randomInt } from 'crypto';
import {
  FORGET_PASS_AR,
  FORGET_PASS_EN,
  OTP_TOKEN_EXPIRE,
  PROFILE_PHOTO_FILE,
  REFRESH_TTL,
} from 'src/hatly.constants';
import { RegisterDto } from './dto/register.dto';
import { AuthGoogleService } from './google-auth.service';
import { TokenPayload } from 'google-auth-library';
import { UserRole } from 'src/user/user.role.enum';
import { SocialLoginDto } from './dto/auth-google.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { extractPublicId } from 'src/shared/extract-public-id';
import { TeacherService } from 'src/user/teacher/teacher.service';
import { StudentService } from 'src/user/student/student.service';
import { CreateStudentDto } from 'src/user/student/create-student.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private configService: ConfigService,
    private cloudinary: CloudinaryService,
    private mailService: MailService,
    private readonly googleAuthService: AuthGoogleService,
    private readonly teacherService: TeacherService,
    private readonly studentService: StudentService,
  ) {}

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;
    console.log('Login attempt for email:', email);
      const user = await this.userService.findOneByEmail(email);
    console.log('Found user:', user ? 'yes' : 'no');
    
    if (!user) {
      console.log('user not found');
      throw new UnauthorizedException('Email or password is not correct');
    }

    console.log('Comparing passwords...');
    console.log('Input password:', password);
    console.log('Stored hash:', user.password);
    
    const isPasswordValid = await comparePassword(password, user.password);
    console.log('Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('password not correct');
      throw new UnauthorizedException('Email or password is not correct');
    }

    return this.generateAndStoreTokens(user);
  }

  async signUp(createUser: RegisterDto) {
    console.log('Registration attempt for email:', createUser.email);
    console.log('Password before hashing:', createUser.password);
    const user = await this.userService.create(createUser as CreateUserDto);
    
    console.log('User created with hashed password:', user.password);
    return this.generateAndStoreTokens(user);
  }

  async googleLogin(authGoogleLoginDto: SocialLoginDto) {
    try {
      const googleData = await this.googleAuthService.fetchProfileByToken(
        authGoogleLoginDto.idToken,
      );

      const userExist = await this.userService.findOneByEmail(
        googleData.email,
      );
      if (userExist) {
        await this.updateUserHandler(googleData, userExist);

        return this.generateAndStoreTokens(userExist);
      }

      const user = await this.userService.create({
        email: googleData.email,
        firstName: googleData.given_name,
        lastName: googleData.family_name,
        profilePhoto: googleData.picture,
        role: UserRole.CUSTOMER,
      } as CreateUserDto);

      return this.generateAndStoreTokens(user);
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }

  private async updateUserHandler(newData: TokenPayload, user: User) {
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

  async checkAccessToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      });

      const user = await this.userService.findOneById(payload.userId);

      if (!user) {
        throw new UnauthorizedException('Invalid Token');
      }

      return { status: true, user };
    } catch (error) {
      throw new UnauthorizedException('Invalid Token');
    }
  }

  async sendForgetPassEmail(sendEmail: SendEmailDto) {
    const user = await this.userService.findOneByEmail(sendEmail.email);
    if (!user) {
      throw new NotFoundException('Email not found');
    }

    if (user.password == null) {
      throw new NotFoundException('This email not allowed to this operation');
    }

    const otp = this.generateOTP();

    user.otpToken = otp;
    user.otpExp = OTP_TOKEN_EXPIRE;

    await this.userService.update(user.userId, user, null);
    const finalPath = sendEmail.ar ? FORGET_PASS_AR : FORGET_PASS_EN;
    this.mailService.sendEmail(user.email, 'Forget Password', finalPath, {
      otp,
    });
    return;
  }

  async checkOtp(otp: string) {
    return (await this.userService.isValidOtp(otp)) ? true : false;
  }

  async resetPassword(otp: number, password: string) {
    const user = await this.userService.isValidOtp(otp.toString());

    if (!user) {
      throw new NotFoundException('OTP not found');
    }

    user.otpToken = null;
    user.otpExp = null;
    user.password = password;

    await this.userService.update(user.userId, user, null);

    return { status: true };
  }

  private generateOTP(): string {
    const randomNumber = randomInt(0, 9999);
    return randomNumber.toString().padStart(4, '0');
  }

  private generateAccessToken(user: User) {
    const payload = { userId: user.userId, role: user.role, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN'),
    });

    return accessToken;
  }

  private getSignature(token: string) {
    return token.split('.')[2];
  }

  private async generateAndStoreTokens(user: User) {
    const accessToken = this.generateAccessToken(user);
    return {
      accessToken,
      user,
    };
  }

  // Assistant-only method to create students
  async createStudentByAssistant(createStudentDto: CreateStudentDto, id: string) {
    // Verify that the user is an assistant
    const user = await this.userService.findOneById(id);
    if (!user || user.role !== UserRole.ASSISTANT) {
      throw new ForbiddenException('Only assistants can create students');
    }

    // Create the student entity without user account (no system access)
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
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        phoneNumber: student.user.phone,
        parentPhoneNumber: student.parentPhoneNumber,
      },
    };
  }
}
