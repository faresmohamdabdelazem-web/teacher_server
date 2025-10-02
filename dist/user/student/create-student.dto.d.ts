export declare class CreateStudentDto {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    whatsapp?: string;
    parentPhoneNumber?: string;
    section: string;
    grade?: string;
    nationalId: string;
    location?: string;
    branchId: string;
    notes?: {
        text: string;
        createdAt?: Date;
    }[];
    profilePhoto?: string;
    manualEntryId?: string;
    totalAmount?: number;
    downPayment?: number;
    remainingDownPayment?: number;
    throughPerson?: string;
    cashReceiver?: string;
    receiptNumber?: string;
}
