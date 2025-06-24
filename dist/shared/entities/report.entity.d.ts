import { BaseEntity } from 'typeorm';
export declare class BaseReport extends BaseEntity {
    id: string;
    generateId(): void;
    createdAt: Date;
    updatedAt: Date;
}
