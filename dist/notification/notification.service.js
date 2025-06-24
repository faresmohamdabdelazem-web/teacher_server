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
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const firebase_provider_1 = require("../firebase/firebase.provider");
let NotificationService = class NotificationService {
    constructor(firebaseRepo) {
        this.firebaseRepo = firebaseRepo;
    }
    async pushNotification(fcmToken, title, body, payload) {
        try {
            const notifyResponse = await this.firebaseRepo.message.send({
                token: fcmToken,
                notification: {
                    title: title,
                    body: body,
                },
                data: payload
            });
            common_1.Logger.log(`NOTIFICATION INFO ==> ${notifyResponse}`);
            return notifyResponse;
        }
        catch (error) {
            common_1.Logger.error('NOTIFICATION', error);
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_provider_1.FirebaseRepository])
], NotificationService);
//# sourceMappingURL=notification.service.js.map