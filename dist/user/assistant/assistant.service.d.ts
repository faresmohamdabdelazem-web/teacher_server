import { Repository } from 'typeorm';
import { Assistant } from './assistant.entity';
import { User } from '../entities/user.entity';
export declare class AssistantService {
    private assistantRepository;
    constructor(assistantRepository: Repository<Assistant>);
    createWithUser(user: User, teacherId?: string): Promise<Assistant>;
    createWithUserAndTeacher(user: User, teacherId: string): Promise<Assistant>;
    findByTeacher(teacherId: string): Promise<Assistant[]>;
    findByUserId(userId: string): Promise<Assistant | null>;
}
