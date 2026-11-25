import { Controller, Get, Header, Module, ServiceUnavailableException } from '@nestjs/common';
import { getHealth } from './health';
import { createReadinessCheck } from './readiness';
import { localReadinessProbes } from './readiness-probes';

const checkReadiness = createReadinessCheck(localReadinessProbes());

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return getHealth();
  }

  @Get('ready')
  @Header('Cache-Control', 'no-store')
  async ready() {
    const result = await checkReadiness();
    if (result.status !== 'ready') throw new ServiceUnavailableException(result);
    return result;
  }
}

@Module({ controllers: [HealthController] })
export class AppModule {}
