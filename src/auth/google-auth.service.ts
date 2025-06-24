import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthGoogleService {
  private google: OAuth2Client;
  constructor(private configService: ConfigService) {
    this.google = new OAuth2Client({
      clientId: this.configService.get('GOOGLE_AUTH_CLIENT_ID_IOS'),
      clientSecret: this.configService.get('GOOGLE_AUTH_CLIENT_SECRET'),
    });
  }

  async fetchProfileByToken(tokenId: string) {
    const ticket = await this.google.verifyIdToken({
      idToken: tokenId,
      audience: [
        this.configService.getOrThrow('GOOGLE_AUTH_CLIENT_ID'),
        this.configService.getOrThrow('GOOGLE_AUTH_CLIENT_ID_IOS'),
      ],
    });

    const data = ticket.getPayload();

    if (!data) throw new NotFoundException('User not found');

    Logger.log('GOOGLE AUTH SUCCESS');

    return data;
  }
}
