/**
 * Per-request credential threading (gateway mode).
 *
 * Previously getCredentials() only ever read process.env.TIMEZEST_API_TOKEN —
 * a process-global value nothing ever set per request — so every gateway-mode
 * tool call fell through to whatever the container happened to boot with
 * (usually nothing, hence "no credentials configured"; worse, if the env var
 * were ever set, every tenant would silently share that one token). These
 * tests pin the AsyncLocalStorage-scoped store that replaces it.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCredentials, runWithCredentials, getClient, type Credentials } from '../utils/client.js';

describe('getCredentials — request-scoped store', () => {
  const originalEnv = process.env.TIMEZEST_API_TOKEN;

  beforeEach(() => {
    delete process.env.TIMEZEST_API_TOKEN;
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.TIMEZEST_API_TOKEN;
    else process.env.TIMEZEST_API_TOKEN = originalEnv;
  });

  it('returns null when neither the store nor the env var carries a token', () => {
    expect(getCredentials()).toBeNull();
  });

  it('falls back to the env var outside of runWithCredentials', () => {
    process.env.TIMEZEST_API_TOKEN = 'env-token';
    expect(getCredentials()).toEqual({ apiToken: 'env-token' });
  });

  it('returns the scoped credential inside runWithCredentials, ignoring the env var', () => {
    process.env.TIMEZEST_API_TOKEN = 'env-token';
    runWithCredentials({ apiToken: 'request-token' }, () => {
      expect(getCredentials()).toEqual({ apiToken: 'request-token' });
    });
    // Outside the scope, the env fallback still applies.
    expect(getCredentials()).toEqual({ apiToken: 'env-token' });
  });

  it('isolates concurrent requests with different tokens (the actual multi-tenant bug)', async () => {
    const seenInA: Array<Credentials | null> = [];
    const seenInB: Array<Credentials | null> = [];

    async function simulateRequest(token: string, seen: Array<Credentials | null>) {
      await runWithCredentials({ apiToken: token }, async () => {
        seen.push(getCredentials());
        await new Promise((resolve) => setTimeout(resolve, 5));
        seen.push(getCredentials());
      });
    }

    await Promise.all([simulateRequest('tenant-a', seenInA), simulateRequest('tenant-b', seenInB)]);

    expect(seenInA).toEqual([{ apiToken: 'tenant-a' }, { apiToken: 'tenant-a' }]);
    expect(seenInB).toEqual([{ apiToken: 'tenant-b' }, { apiToken: 'tenant-b' }]);
  });
});

describe('getClient', () => {
  afterEach(() => {
    delete process.env.TIMEZEST_API_TOKEN;
  });

  it('throws when no credentials are configured', async () => {
    await expect(getClient()).rejects.toThrow(/No TimeZest API credentials configured/);
  });

  it('builds a client from the request-scoped token', async () => {
    const client = await runWithCredentials({ apiToken: 'request-token' }, () => getClient());
    expect(client).toBeDefined();
  });
});
