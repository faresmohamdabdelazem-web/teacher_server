import { FirebaseRepository } from 'src/firebase/firebase.provider';
export declare class NotificationService {
    private readonly firebaseRepo;
    constructor(firebaseRepo: FirebaseRepository);
    pushNotification(fcmToken: string, title: string, body: string, payload?: {
        screen?: string;
        id?: string;
    }): Promise<string>;
}
