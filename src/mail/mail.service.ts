import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendEmail(
    email: string,
    subject: string,
    templatePath: string,
    context: any,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject,
        template: templatePath,
        context,
      });
      Logger.log('Email sent');
    } catch (error) {
      Logger.error(error, 'MailService');
      return error;
    }
  }
}
