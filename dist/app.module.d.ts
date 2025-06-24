import { MiddlewareConsumer } from '@nestjs/common';
import { UserService } from './user/user.service';
export declare class AppModule {
    private readonly userService;
    constructor(userService: UserService);
    onModuleInit(): Promise<void>;
    configure(consumer: MiddlewareConsumer): void;
}
