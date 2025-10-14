declare class ActivityDto {
    title: string;
    subTitle: string;
    createdAt?: Date;
}
export declare class CreateStudentDto {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    whatsapp?: string;
    parentPhoneNumber?: string;
    grade?: string;
    nationalId: string;
    location?: string;
    branchId: string;
    sectionId: string;
    notes?: {
        title: string;
        descroption: string;
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
    activities?: ActivityDto[];
}
export {};
