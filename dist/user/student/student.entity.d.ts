import { Teacher } from '../teacher/teacher.entity';
import { Lesson } from '../../lesson/entities/lesson.entity';
import { Installment } from 'src/Installment/entities/installment.entity';
import { Branch } from 'src/branch/entities/branch.entity';
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
    paidAmount: number;
    remainingBalance: number;
    throughPerson?: string;
    branch: Branch;
    cashReceiver?: string;
    receiptNumber?: string;
    createdAt: Date;
    updatedAt: Date;
    teachers: Teacher[];
    lessons: Lesson[];
    installments: Installment[];
}
