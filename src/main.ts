import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NotFoundAndBadRequestFilter } from './common/filters/not-found.filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  // const app = await NestFactory.create(AppModule);
  // app.useGlobalFilters(new NotFoundAndBadRequestFilter());
  // await app.listen(3000);
}
bootstrap();
