import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { HttpExceptionFilter } from 'src/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import morgan from "morgan"
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const port = process.env.PORT || 3000;

  app.useBodyParser('json', { limit: '15mb' });
  app.use(cookieParser());
app.use(morgan("dev"))
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    credentials: true,
    origin: '*',
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  app.setGlobalPrefix('/api/v2');

  await app.listen(port!);
}
bootstrap();
