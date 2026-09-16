import { describe, expect, test } from 'vitest';
import { ApiError, getJson } from '../../src/big-days/api';

function responder(statuses: number[]) {
  let i = 0;
  const calls: string[] = [];
  const fetchImpl = (async (input: Parameters<typeof fetch>[0]) => {
    calls.push(String(input));
    const status = statuses[Math.min(i++, statuses.length - 1)];
    if (status === 0) throw new TypeError('Failed to fetch');
    const body =
      status === 200
        ? { ok: true }
        : status === 503
          ? { error: 'backend restarting', retryable: true }
          : { detail: 'bad region code' };
    return new globalThis.Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  return { fetchImpl, calls };
}

describe('big days API client', () => {
  test('retries through a restart and reports each wait', async () => {
    const { fetchImpl, calls } = responder([503, 502, 0, 200]);
    const waits: number[] = [];
    const r = await getJson<{ ok: boolean }>('/meta', {
      fetchImpl,
      delays: [1, 1, 1, 1, 1],
      onRetry: (_attempt, delayMs) => waits.push(delayMs),
    });
    expect(r).toEqual({ ok: true });
    expect(calls.length).toBe(4);
    expect(waits).toEqual([1, 1, 1]);
  });

  test('gives up after the delays are exhausted with a retryable error', async () => {
    const { fetchImpl, calls } = responder([503]);
    await expect(
      getJson('/meta', { fetchImpl, delays: [1, 1] })
    ).rejects.toMatchObject({ status: 503, retryable: true });
    expect(calls.length).toBe(3);
  });

  test('does not retry a 400 and surfaces the message', async () => {
    const { fetchImpl, calls } = responder([400]);
    const err = (await getJson('/top', { fetchImpl, delays: [1, 1] }).catch(
      (e: unknown) => e
    )) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe('bad region code');
    expect(err.retryable).toBe(false);
    expect(calls.length).toBe(1);
  });

  test('retry: false makes one attempt only', async () => {
    const { fetchImpl, calls } = responder([503]);
    await expect(
      getJson('/search', { fetchImpl, retry: false })
    ).rejects.toThrow();
    expect(calls.length).toBe(1);
  });
});
