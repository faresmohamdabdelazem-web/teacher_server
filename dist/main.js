"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const common_1 = require("@nestjs/common");
const response_interceptor_1 = require("./interceptors/response.interceptor");
const http_exception_filter_1 = require("./filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
    });
    const port = process.env.PORT || 3000;
    app.useBodyParser('json', { limit: '15mb' });
    app.use((0, cookie_parser_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.enableCors({
        credentials: true,
        origin: '*',
    });
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor(), new common_1.ClassSerializerInterceptor(app.get(core_1.Reflector)));
    app.setGlobalPrefix('/api/v2');
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map