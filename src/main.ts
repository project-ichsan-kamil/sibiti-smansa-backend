import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { SubjectSeeder } from './seeder/SubjectSeeder';
import * as cookieParser from 'cookie-parser';
import { ClassSeeder } from './seeder/ClassSeeder';
import { SeederModule } from './seeder/seeder.module';

async function bootstrap() {
  dotenv.config();
  // const app = await NestFactory.create(AppModule , {cors : true});
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:5173', // Update this with your frontend URL
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  });

  //seeder
  const subjectSeeder = app.select(SeederModule).get(SubjectSeeder);
  await subjectSeeder.run();
  const classSeeder = app.select(SeederModule).get(ClassSeeder);
  await classSeeder.run();

  
  await app.listen(3001);
}
bootstrap();
