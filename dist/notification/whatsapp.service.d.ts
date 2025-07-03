import { ConfigService } from '@nestjs/config';
export interface WhatsAppMessage {
    to: string;
    body: string;
}
export declare class WhatsAppService {
    private configService;
    private readonly logger;
    private readonly instanceId;
    private readonly token;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    sendMessage(message: WhatsAppMessage): Promise<boolean>;
    sendAbsenceNotification(parentPhoneNumber: string, studentName: string, lessonTitle: string, lessonDate: Date, subject: string): Promise<boolean>;
    sendPresentNotification(parentPhoneNumber: string, studentName: string, lessonTitle: string, lessonDate: Date, subject: string): Promise<boolean>;
    sendImageBarcode(to: string, base64Image: string): Promise<boolean>;
}
