import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [ConfigModule],
  providers: [NotificationService, WhatsAppService],
  exports: [NotificationService, WhatsAppService],
})
export class NotificationModule {}
