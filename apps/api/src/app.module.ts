import { Controller, Get, Module } from '@nestjs/common';
import { getHealth } from './health';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return getHealth();
  }
}

@Module({ controllers: [HealthController] })
export class AppModule {}
