import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { SubjectSeeder } from './seeder/SubjectSeeder';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule , {cors : true});
  app.setGlobalPrefix('api');

  //seeder
  const subjectSeeder = app.get(SubjectSeeder);
  await subjectSeeder.run();

  
  await app.listen(3001);
}
bootstrap();
