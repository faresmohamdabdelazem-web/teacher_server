"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
const path_1 = require("path");
const handlebars_adapter_1 = require("@nestjs-modules/mailer/dist/adapters/handlebars.adapter");
const assets_module_1 = require("./assets/assets.module");
const user_service_1 = require("./user/user.service");
const notification_module_1 = require("./notification/notification.module");
const typeorm_1 = require("@nestjs/typeorm");
const lesson_module_1 = require("./lesson/lesson.module");
let AppModule = class AppModule {
    constructor(userService) {
        this.userService = userService;
    }
    async onModuleInit() {
        await this.userService.createAdmin();
        if (process.env.NODE_ENV == 'dev') {
            await this.userService.createFakeUsers();
        }
        common_1.Logger.log('ADMIN CREATED');
    }
    configure(consumer) {
        consumer.apply(logger_middleware_1.LoggerMiddleware).forRoutes('*');
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
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST,
                port: +process.env.DB_PORT,
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DATABASE,
                autoLoadEntities: true,
                synchronize: process.env.NODE_ENV == 'prod' ? false : true,
                ssl: true,
            }),
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            cloudinary_module_1.CloudinaryModule,
            mail_module_1.MailModule,
            mailer_1.MailerModule.forRoot({
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
                    dir: (0, path_1.join)(__dirname, 'mail', 'templates'),
                    adapter: new handlebars_adapter_1.HandlebarsAdapter(),
                },
            }),
            assets_module_1.AssetsModule,
            notification_module_1.NotificationModule,
            lesson_module_1.LessonModule,
        ],
        controllers: [],
    }),
    __metadata("design:paramtypes", [user_service_1.UserService])
], AppModule);
//# sourceMappingURL=app.module.js.map