import { pathToFileURL } from 'node:url';

function port(value) {
  if (typeof value !== 'string' || !/^[1-9]\d{0,4}$/.test(value) || Number(value) > 65535) {
    throw new Error('Invalid local service port');
  }
  return value;
}

async function probe(url, timeoutMs, validate) {
  try {
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) {
      await response.body?.cancel();
      return false;
    }
    return await validate(response);
  } catch {
    return false;
  }
}

export async function checkHttp({ apiPort = '4000', webPort = '3000', timeoutMs = 3000 } = {}) {
  const apiUrl = `http://127.0.0.1:${port(apiPort)}/api/v1/health`;
  const webUrl = `http://127.0.0.1:${port(webPort)}/`;
  const [api, web] = await Promise.all([
    probe(apiUrl, timeoutMs, async response => {
      const body = await response.json();
      return body?.service === 'construct-ai-api' && body?.status === 'ok' && body?.check === 'liveness';
    }),
    probe(webUrl, timeoutMs, async response => {
      const html = await response.text();
      return /<h2[^>]*>Service status<\/h2>/.test(html) && /<span\b[^>]*\brole="status"[^>]*>Responding<\/span>/.test(html);
    }),
  ]);
  return { api, web };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await checkHttp({ apiPort: process.env.API_PORT, webPort: process.env.WEB_PORT });
    console.log(JSON.stringify(result));
    process.exitCode = result.api && result.web ? 0 : 1;
  } catch {
    console.error('Invalid local HTTP smoke configuration');
    process.exitCode = 1;
  }
}
