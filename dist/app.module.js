"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const logger_middleware_1 = require("./middleware/logger.middleware");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const config_1 = require("@nestjs/config");
const cloudinary_module_1 = require("./cloudinary/cloudinary.module");
const mail_module_1 = require("./mail/mail.module");
const mailer_1 = require("@nestjs-modules/mailer");
const assets_module_1 = require("./assets/assets.module");
const notification_module_1 = require("./notification/notification.module");
const typeorm_1 = require("@nestjs/typeorm");
const lesson_module_1 = require("./lesson/lesson.module");
const admin_controller_1 = require("./admin/admin.controller");
const installment_module_1 = require("./Installment/installment.module");
const branch_module_1 = require("./branch/branch.module");
const section_module_1 = require("./section/section.module");
const revenue_module_1 = require("./revenues/revenue.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(logger_middleware_1.LoggerMiddleware)
            .exclude()
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                ignoreEnvFile: false,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    type: 'postgres',
                    url: config.get('DATABASE_URL'),
                    autoLoadEntities: true,
                    synchronize: true,
                    ssl: true,
                    extra: {
                        ssl: { rejectUnauthorized: false },
                    },
                }),
            }),
            auth_module_1.AuthModule,
            section_module_1.SectionModule,
            user_module_1.UserModule,
            installment_module_1.InstallmentModule,
            branch_module_1.BranchModule,
            revenue_module_1.RevenueModule,
            cloudinary_module_1.CloudinaryModule,
            mail_module_1.MailModule,
            mailer_1.MailerModule.forRoot({
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
            assets_module_1.AssetsModule,
            notification_module_1.NotificationModule,
            lesson_module_1.LessonModule,
        ],
        controllers: [admin_controller_1.AdminController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map