import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabaseClient } from './client.ts';

async function main() {
  const db = createDatabaseClient();
  const deadline = setTimeout(() => {
    console.error('Prisma smoke deadline exceeded');
    process.exit(1);
  }, 15000);
  const id = randomUUID();
  const marker = 'synthetic-foundation-probe';
  try {
    await db.$transaction(async tx => {
      await tx.foundationProbe.create({ data: { id, marker } });
      const row = await tx.foundationProbe.findUniqueOrThrow({ where: { id } });
      assert.deepEqual(row, { id, marker });
      await tx.foundationProbe.delete({ where: { id } });
    }, { maxWait: 3000, timeout: 5000 });
    console.log('Prisma synthetic create/read/delete round-trip verified');
  } finally {
    try { await db.$disconnect(); } finally { clearTimeout(deadline); }
  }
}

void main().catch(() => {
  console.error('Prisma round-trip failed; check local connection, migrations and grants');
  process.exitCode = 1;
});
