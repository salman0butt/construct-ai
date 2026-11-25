import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { parseApiPort } from './health';

async function bootstrap() {
  const port = parseApiPort(process.env.API_PORT);
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  await app.listen(port, '127.0.0.1');
}

void bootstrap().catch((error: unknown) => {
  console.error('API startup failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
