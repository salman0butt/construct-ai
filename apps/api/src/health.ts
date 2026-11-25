export function getHealth() {
  return { service: 'construct-ai-api', status: 'ok', check: 'liveness' } as const;
}

export function parseApiPort(value: string | undefined): number {
  const raw = value ?? '4000';
  const port = Number(raw);
  if (!/^[1-9]\d{0,4}$/.test(raw) || port > 65535) {
    throw new Error('API_PORT must be an integer from 1 to 65535');
  }
  return port;
}
