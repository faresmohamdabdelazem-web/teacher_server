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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGoogleService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const google_auth_library_1 = require("google-auth-library");
let AuthGoogleService = class AuthGoogleService {
    constructor(configService) {
        this.configService = configService;
        this.google = new google_auth_library_1.OAuth2Client({
            clientId: this.configService.get('GOOGLE_AUTH_CLIENT_ID_IOS'),
            clientSecret: this.configService.get('GOOGLE_AUTH_CLIENT_SECRET'),
        });
    }
    async fetchProfileByToken(tokenId) {
        const ticket = await this.google.verifyIdToken({
            idToken: tokenId,
            audience: [
                this.configService.getOrThrow('GOOGLE_AUTH_CLIENT_ID'),
                this.configService.getOrThrow('GOOGLE_AUTH_CLIENT_ID_IOS'),
            ],
        });
        const data = ticket.getPayload();
        if (!data)
            throw new common_1.NotFoundException('User not found');
        common_1.Logger.log('GOOGLE AUTH SUCCESS');
        return data;
    }
};
exports.AuthGoogleService = AuthGoogleService;
exports.AuthGoogleService = AuthGoogleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AuthGoogleService);
//# sourceMappingURL=google-auth.service.js.map