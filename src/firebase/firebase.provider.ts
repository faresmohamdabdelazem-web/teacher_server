import { Inject, Injectable } from '@nestjs/common';
import { app } from 'firebase-admin';
import { Messaging } from 'firebase-admin/lib/messaging/messaging';

@Injectable()
export class FirebaseRepository {
  message: Messaging;

  constructor(@Inject('FIREBASE_APP') private firebaseApp: app.App) {
    this.message = firebaseApp.messaging();
  }
}
