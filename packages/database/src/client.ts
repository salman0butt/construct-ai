import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.ts';
import { runtimeConnection } from './connections.ts';

// Server only. Callers own lifecycle; never import into browser code.
export function createDatabaseClient() {
  const adapter = new PrismaPg({
    connectionString: runtimeConnection(process.env),
    max: 2,
    connectionTimeoutMillis: 3000,
  }, { schema: 'construct_ai' });
  return new PrismaClient({ adapter });
}
