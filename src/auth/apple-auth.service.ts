import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import appleSigninAuth from 'apple-signin-auth';

@Injectable()
export class AuthAppleService {
  constructor(private configService: ConfigService) {}

  async getProfileByToken(loginDto: string) {
    const data = await appleSigninAuth.verifyIdToken(loginDto, {
      audience: this.configService.getOrThrow('APPLE_APP_AUDIENCE', {
        infer: true,
      }),
    });

    Logger.log('APPLE AUTH DATA', data);
    return data;
  }
}
