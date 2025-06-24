import { app } from 'firebase-admin';
import { Messaging } from 'firebase-admin/lib/messaging/messaging';
export declare class FirebaseRepository {
    private firebaseApp;
    message: Messaging;
    constructor(firebaseApp: app.App);
}
