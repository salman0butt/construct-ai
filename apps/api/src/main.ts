import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { parseApiPort } from './health';

async function bootstrap() {
  if (existsSync('.env')) loadEnvFile('.env');
  const port = parseApiPort(process.env.API_PORT);
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  await app.listen(port, '127.0.0.1');
}

void bootstrap().catch(() => {
  console.error('API startup failed; verify local configuration');
  process.exitCode = 1;
});
