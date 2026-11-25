const names = ['database', 'redis', 'storage', 'worker'] as const;
type Dependency = (typeof names)[number];
type State = 'up' | 'down' | 'timeout';
type Probe = (signal: AbortSignal) => unknown | Promise<unknown>;
export type ReadinessProbes = Partial<Record<Dependency, Probe>>;
export type ReadinessResult = {
  service: 'construct-ai-api';
  check: 'readiness';
  status: 'ready' | 'not_ready';
  checks: Record<Dependency, State>;
};

async function runProbe(probe: Probe | undefined, timeoutMs: number): Promise<State> {
  if (!probe) return 'down';
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<State>(resolve => {
      timer = setTimeout(() => { resolve('timeout'); controller.abort(); }, timeoutMs);
    });
    const work = Promise.resolve().then(() => probe(controller.signal))
      .then<State>(value => value === true ? 'up' : 'down')
      .catch((): State => 'down');
    return await Promise.race([timeout, work]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export function createReadinessCheck(probes: ReadinessProbes, timeoutMs = 3000): () => Promise<ReadinessResult> {
  let inFlight: Promise<ReadinessResult> | undefined;
  return () => {
    if (!inFlight) {
      inFlight = (async (): Promise<ReadinessResult> => {
        const entries = await Promise.all(names.map(async name => [name, await runProbe(probes[name], timeoutMs)] as const));
        const checks = Object.fromEntries(entries) as Record<Dependency, State>;
        return { service: 'construct-ai-api', check: 'readiness', status: names.every(name => checks[name] === 'up') ? 'ready' : 'not_ready', checks };
      })().finally(() => { inFlight = undefined; });
    }
    return inFlight;
  };
}
