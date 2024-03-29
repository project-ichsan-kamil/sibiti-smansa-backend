import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule , {cors : true});
  await app.listen(3000);

  // const app = await NestFactory.create(AppModule);
  // app.useGlobalFilters(new NotFoundAndBadRequestFilter());
  // await app.listen(3000);
}
bootstrap();
