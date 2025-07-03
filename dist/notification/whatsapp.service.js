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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let WhatsAppService = WhatsAppService_1 = class WhatsAppService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(WhatsAppService_1.name);
        this.instanceId = this.configService.get('ULTRAMSG_INSTANCE_ID');
        this.token = this.configService.get('ULTRAMSG_TOKEN');
        this.baseUrl = `https://api.ultramsg.com/${this.instanceId}/messages/chat`;
    }
    async sendMessage(message) {
        try {
            const response = await axios_1.default.post(this.baseUrl, {
                token: this.token,
                to: message.to,
                body: message.body,
            });
            this.logger.log(`WhatsApp message sent successfully to ${message.to}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send WhatsApp message to ${message.to}:`, error.message);
            return false;
        }
    }
    async sendAbsenceNotification(parentPhoneNumber, studentName, lessonTitle, lessonDate, subject) {
        const formattedDate = lessonDate.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const message = `عزيزي ولي الأمر،

كان الطالب ${studentName} غائباً عن الدرس التالي:

📚 المادة: ${subject}
📖 الدرس: ${lessonTitle}
📅 التاريخ: ${formattedDate}

يرجى التأكد من حضور الطالب للدروس القادمة. إذا كان هناك سبب وجيه للغياب، يرجى التواصل مع المعلم.

شكراً لك،
فريق إدارة المدرسة`;
        return this.sendMessage({
            to: `+2${parentPhoneNumber}`,
            body: message,
        });
    }
    async sendPresentNotification(parentPhoneNumber, studentName, lessonTitle, lessonDate, subject) {
        const formattedDate = lessonDate.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const message = `عزيزي ولي الأمر،\n\nنود إعلامكم أن الطالب ${studentName} قد حضر الدرس التالي بنجاح:\n\n📚 المادة: ${subject}\n📖 الدرس: ${lessonTitle}\n📅 التاريخ: ${formattedDate}\n\nشكراً لكم على متابعتكم وحرصكم على انتظام الطالب.\n\nفريق إدارة المدرسة`;
        return this.sendMessage({
            to: `+2${parentPhoneNumber}`,
            body: message,
        });
    }
    async sendImageBarcode(to, base64Image) {
        console.log(to, base64Image);
        const url = `https://api.ultramsg.com/${this.instanceId}/messages/image`;
        try {
            const response = await axios_1.default.post(url, {
                token: this.token,
                to,
                image: base64Image,
                caption: "هذا هو باركود الحضور الخاص بك. يرجى حفظه وإحضاره معك ليتم مسحه عند حضور الدروس.",
            });
            this.logger.log(`WhatsApp image sent successfully to ${to}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send WhatsApp image to ${to}:`, error.message);
            return false;
        }
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map