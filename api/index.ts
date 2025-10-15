import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import cookieParser from 'cookie-parser';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from '../src/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';

let app: NestExpressApplication;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      rawBody: true,
    });

    app.useBodyParser('json', { limit: '15mb' });
    app.use(cookieParser());
    app.use(helmet());
    app.use(compression());

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    const corsOrigins = (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_URL || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    app.enableCors({
      credentials: true,
      origin: (origin, callback) => {
        if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
    });

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(
      new ResponseInterceptor(),
      new ClassSerializerInterceptor(app.get(Reflector)),
    );

    app.setGlobalPrefix('/api/v2');

    await app.init();
  }
  return app;
}

// Export for Vercel serverless functions
export default async function handler(req: any, res: any) {
  const app = await bootstrap();
  const expressInstance = app.getHttpAdapter().getInstance();
  
  return expressInstance(req, res);
} 