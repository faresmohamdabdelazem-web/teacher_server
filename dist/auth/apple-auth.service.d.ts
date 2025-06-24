import { ConfigService } from '@nestjs/config';
export declare class AuthAppleService {
    private configService;
    constructor(configService: ConfigService);
    getProfileByToken(loginDto: string): Promise<import("apple-signin-auth").AppleIdTokenType>;
}
