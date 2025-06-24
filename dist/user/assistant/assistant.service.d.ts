import { Repository } from 'typeorm';
import { Assistant } from './assistant.entity';
import { User } from '../entities/user.entity';
export declare class AssistantService {
    private assistantRepository;
    constructor(assistantRepository: Repository<Assistant>);
    createWithUser(user: User): Promise<Assistant>;
}
