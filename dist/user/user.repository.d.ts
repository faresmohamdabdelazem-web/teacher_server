import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UserRepository extends Repository<User> {
    private dataSource;
    constructor(dataSource: DataSource);
}
