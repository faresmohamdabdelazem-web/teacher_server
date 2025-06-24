import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
  Patch,
  UsePipes,
  UseGuards,
  Get,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { Request, Response } from 'express';
import { CheckJwtDto } from './dto/check.jwt.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGoogleService } from './google-auth.service';
import { SocialLoginDto } from './dto/auth-google.dto';
import { PhoneNumberPipe } from 'src/shared/phone-number.pipe';
import { AuthGuard } from './guard/auth.guard';
import { RoleGuard } from './guard/role.guard';
import { UserRole } from 'src/user/user.role.enum';
import { Roles } from 'src/decorators/role.decorator';
import { GetSignedUser } from 'src/decorators/get.signed.user.decorator';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: AuthGoogleService,
  ) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.signUp(registerDto);
  }

  @Post('send-email')
  sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return this.authService.sendForgetPassEmail(sendEmailDto);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      +resetPasswordDto.otp,
      resetPasswordDto.newPassword,
    );
  }

  @Post('google')
  googleAuth(@Body() authGoogleDto: SocialLoginDto) {
    return this.authService.googleLogin(authGoogleDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@GetSignedUser() user: any) {
    return this.authService.signOut(user.refreshToken);
  }
}
