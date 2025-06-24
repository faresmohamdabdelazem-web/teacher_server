import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  exports: [NotificationService],
  controllers: [],
  providers: [NotificationService],
})
export class NotificationModule {}
