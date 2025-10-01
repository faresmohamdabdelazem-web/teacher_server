import { Teacher } from '../teacher/teacher.entity';
import { Lesson } from '../../lesson/entities/lesson.entity';
import { Installment } from 'src/Installment/entities/installment.entity';
export declare class Student {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    whatsapp?: string;
    parentPhoneNumber?: string;
    section?: string;
    grade?: string;
    nationalId?: string;
    location?: string;
    branchId?: string;
    notes: {
        text: string;
        createdAt: Date;
    }[];
    profilePhoto?: string;
    manualEntryId: string;
    installmentStage: number;
    totalAmount?: number;
    downPayment?: number;
    remainingDownPayment?: number;
    throughPerson?: string;
    cashReceiver?: string;
    receiptNumber?: string;
    createdAt: Date;
    updatedAt: Date;
    teachers: Teacher[];
    lessons: Lesson[];
    installments: Installment[];
    generateId(): void;
}
