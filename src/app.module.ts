import { Logger, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MailModule } from './mail/mail.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { AssetsModule } from './assets/assets.module';
import { NotificationModule } from './notification/notification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonModule } from './lesson/lesson.module';
import { AdminController } from './admin/admin.controller';
import { InstallmentModule } from './Installment/installment.module';
import { BranchModule } from './branch/branch.module';
import { SectionModule } from './section/section.module';
import { RevenueModule } from './revenues/revenue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: true,
        extra: {
          ssl: { rejectUnauthorized: false },
        },
      }),
    }),
    AuthModule,
    SectionModule,
    UserModule,
    InstallmentModule,
    BranchModule,
    RevenueModule,
    CloudinaryModule,
    MailModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.MAIL_PORT || '465'),
        secure: (process.env.MAIL_SECURE || 'true') === 'true',
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.EMAIL_PASS,
        },
      },
      defaults: {
        from: `"no-reply@hatly.tech`,
      },
    }),
    AssetsModule,
    NotificationModule,
    LessonModule,
  ],
  controllers: [AdminController],
})
export class AppModule {
  // تم حذف الـ constructor و onModuleInit من هنا
  
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude()
      .forRoutes('*');
  }
}