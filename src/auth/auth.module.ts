import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MailService } from 'src/mail/mail.service';
import { UserModule } from 'src/user/user.module';
import { AuthGoogleService } from './google-auth.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    CloudinaryService,
    MailService,
    AuthGoogleService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
