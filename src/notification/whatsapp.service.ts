import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface WhatsAppMessage {
    to: string;
    body: string;
}

@Injectable()
export class WhatsAppService {
    private readonly logger = new Logger(WhatsAppService.name);
    private readonly instanceId: string;
    private readonly token: string;
    private readonly baseUrl: string;

    constructor(private configService: ConfigService) {
        this.instanceId = this.configService.get<string>('ULTRAMSG_INSTANCE_ID');
        this.token = this.configService.get<string>('ULTRAMSG_TOKEN');
        this.baseUrl = `https://api.ultramsg.com/${this.instanceId}/messages/chat`;
    }

    async sendMessage(message: WhatsAppMessage): Promise<boolean> {
        try {
            const response = await axios.post(this.baseUrl, {
                token: this.token,
                to: message.to,
                body: message.body,
            });

            this.logger.log(`WhatsApp message sent successfully to ${message.to}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send WhatsApp message to ${message.to}:`, error.message);
            return false;
        }
    }

    async sendAbsenceNotification(
        parentPhoneNumber: string,
        studentName: string,
        lessonTitle: string,
        lessonDate: Date,
        subject: string
    ): Promise<boolean> {
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
} 