import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule , {cors : true});
  app.setGlobalPrefix('api');
  await app.listen(3000);

  await app.listen('3000', '0.0.0.0', () => {
    console.log(`Server is running on: http://0.0.0.0:3000/api`);
  });
}
bootstrap();
