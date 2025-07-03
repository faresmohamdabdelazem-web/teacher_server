import { Logger, MiddlewareConsumer, Module } from '@nestjs/common';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MailModule } from './mail/mail.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { AssetsModule } from './assets/assets.module';
import { UserService } from './user/user.service';
import { NotificationModule } from './notification/notification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonModule } from './lesson/lesson.module';
import { AdminController } from './admin/admin.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      // logging: true,
      synchronize: process.env.NODE_ENV == 'prod' ? false : true,
      ssl: true,
    }),
    AuthModule,
    UserModule,
    CloudinaryModule,
    MailModule,
    MailerModule.forRoot({
      transport: {
        service: process.env.MAIL_HOST,
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.EMAIL_PASS,
        },
      },
      defaults: {
        from: `"no-reply@hatly.tech`,
      },
      template: {
        dir: join(__dirname, 'mail', 'templates'),
        adapter: new HandlebarsAdapter(),
      },
    }),
    AssetsModule,
    NotificationModule,
    LessonModule,
  ],  
  controllers: [AdminController],
})
export class AppModule {
  constructor(private readonly userService: UserService) {}

  async onModuleInit() {
    await this.userService.createAdmin();

    if (process.env.NODE_ENV == 'dev') {
      await this.userService.createFakeUsers();
    }
    Logger.log('ADMIN CREATED');
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
