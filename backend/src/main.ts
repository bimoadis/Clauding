import * as dotenv from 'dotenv';
dotenv.config();
 
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import fastifyCors from '@fastify/cors';
 
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
 
  const instance = app.getHttpAdapter().getInstance();
  await instance.register(fastifyCors, {
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });
 
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
 
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Clauding Backend running on: http://localhost:${port}`);
}
bootstrap();
