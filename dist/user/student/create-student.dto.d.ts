export declare class CreateStudentDto {
    firstName: string;
    lastName: string;
    nationalId: string;
    branchId: string;
    sectionId: string;
    paidDownPayment?: number;
    phoneNumber?: string;
    whatsapp?: string;
    parentPhoneNumber?: string;
    grade?: string;
    location?: string;
    notes?: {
        title: string;
        descroption: string;
        createdAt?: Date;
    }[];
    profilePhoto?: string;
    manualEntryId?: string;
    throughPerson?: string;
    cashReceiver?: string;
    receiptNumber?: string;
}
