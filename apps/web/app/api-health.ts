export async function apiIsLive(): Promise<boolean> {
  const raw = process.env.API_PORT ?? '4000';
  if (!/^[1-9]\d{0,4}$/.test(raw) || Number(raw) > 65535) return false;
  try {
    const response = await fetch('http://127.0.0.1:' + raw + '/api/v1/health', {
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return false;
    const body: unknown = await response.json();
    return typeof body === 'object' && body !== null &&
      'service' in body && body.service === 'construct-ai-api' &&
      'status' in body && body.status === 'ok' &&
      'check' in body && body.check === 'liveness';
  } catch {
    return false;
  }
}
