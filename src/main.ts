import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { SubjectSeeder } from './seeder/SubjectSeeder';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  dotenv.config();
  // const app = await NestFactory.create(AppModule , {cors : true});
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:3000', // Update this with your frontend URL
    credentials: true,
  });

  //seeder
  const subjectSeeder = app.get(SubjectSeeder);
  await subjectSeeder.run();

  
  await app.listen(3001);
}
bootstrap();
