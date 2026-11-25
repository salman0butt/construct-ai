import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { parseApiPort } from './health';

async function bootstrap() {
  if (existsSync('.env')) loadEnvFile('.env');
  const port = parseApiPort(process.env.API_PORT);
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const config = new DocumentBuilder()
    .setTitle('ConstructAI API')
    .setDescription('Local foundation API. Liveness and dependency readiness are separate checks.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: '/docs-json',
    swaggerOptions: { persistAuthorization: false },
  });
  app.enableShutdownHooks();
  await app.listen(port, '127.0.0.1');
}

void bootstrap().catch(() => {
  console.error('API startup failed; verify local configuration');
  process.exitCode = 1;
});
