import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import * as multer from 'multer';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '15gb' }));
  app.use(urlencoded({ limit: '15gb', extended: true }));

  // Enable CORS
  app.enableCors();

  // Enable validation
  app.useGlobalPipes(new ValidationPipe());

  // Set global prefix
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();
