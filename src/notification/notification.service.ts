import { Injectable, Logger } from '@nestjs/common';
import { FirebaseRepository } from 'src/firebase/firebase.provider';

@Injectable()
export class NotificationService {
  constructor(private readonly firebaseRepo: FirebaseRepository) {}
  async pushNotification(fcmToken: string, title: string, body: string , payload?: {
    screen?: string,
    id?: string,
  }) {
    try {
      const notifyResponse = await this.firebaseRepo.message.send({
        token: fcmToken,
        notification: {
          title: title,
          body: body,
        },
        data: payload
      });

      Logger.log(`NOTIFICATION INFO ==> ${notifyResponse}`);
      return notifyResponse;
    } catch (error) {
      Logger.error('NOTIFICATION', error);
    }
  }
}
