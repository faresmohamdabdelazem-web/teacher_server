import { ConfigService } from '@nestjs/config';
export declare class AuthGoogleService {
    private configService;
    private google;
    constructor(configService: ConfigService);
    fetchProfileByToken(tokenId: string): Promise<import("google-auth-library").TokenPayload>;
}
