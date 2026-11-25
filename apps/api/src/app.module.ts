import { Controller, Get, Header, Module, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { getHealth } from './health';
import { createReadinessCheck } from './readiness';
import { localReadinessProbes } from './readiness-probes';

const checkReadiness = createReadinessCheck(localReadinessProbes());

const stateSchema = { type: 'string' as const, enum: ['up', 'down', 'timeout'] };
function readinessSchema(status: 'ready' | 'not_ready') {
  return {
    type: 'object' as const,
    required: ['service', 'check', 'status', 'checks'],
    properties: {
      service: { type: 'string' as const, enum: ['construct-ai-api'] },
      check: { type: 'string' as const, enum: ['readiness'] },
      status: { type: 'string' as const, enum: [status] },
      checks: {
        type: 'object' as const,
        required: ['database', 'redis', 'storage', 'worker'],
        properties: {
          database: stateSchema, redis: stateSchema, storage: stateSchema, worker: stateSchema,
        },
      },
    },
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check API liveness (not infrastructure readiness)' })
  @ApiOkResponse({
    description: 'API process is responding',
    schema: {
      type: 'object',
      required: ['service', 'status', 'check'],
      properties: {
        service: { type: 'string', enum: ['construct-ai-api'] },
        status: { type: 'string', enum: ['ok'] },
        check: { type: 'string', enum: ['liveness'] },
      },
      example: { service: 'construct-ai-api', status: 'ok', check: 'liveness' },
    },
  })
  health() {
    return getHealth();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check required local infrastructure readiness' })
  @ApiOkResponse({ description: 'All required probes are up', schema: readinessSchema('ready') })
  @ApiServiceUnavailableResponse({ description: 'One or more required probes are down or timed out', schema: readinessSchema('not_ready') })
  @Header('Cache-Control', 'no-store')
  async ready() {
    const result = await checkReadiness();
    if (result.status !== 'ready') throw new ServiceUnavailableException(result);
    return result;
  }
}

@Module({ controllers: [HealthController] })
export class AppModule {}
