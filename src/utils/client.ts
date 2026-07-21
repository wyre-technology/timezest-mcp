/**
 * Client construction with credential management.
 *
 * In gateway mode (AUTH_MODE=gateway), credentials arrive per request via
 * the X-Timezest-Api-Token header and are threaded through an
 * AsyncLocalStorage-scoped store (runWithCredentials), never through
 * process.env — env vars are process-global, so mutating one per request
 * would leak one tenant's token to every concurrent request in the same
 * container. In stdio/env mode, credentials come from TIMEZEST_API_TOKEN.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { TimeZestClient } from '../vendor/node-timezest/index.js';
import { logger } from './logger.js';

export interface Credentials {
  apiToken: string;
}

const credentialStore = new AsyncLocalStorage<Credentials>();

export function runWithCredentials<T>(creds: Credentials, fn: () => T): T {
  return credentialStore.run(creds, fn);
}

export function getCredentials(): Credentials | null {
  const scoped = credentialStore.getStore();
  if (scoped?.apiToken) return scoped;

  const apiToken = process.env.TIMEZEST_API_TOKEN;
  if (!apiToken) {
    logger.debug('No TimeZest API token found in environment');
    return null;
  }
  return { apiToken };
}

// The client is cheap to construct (no network I/O in its constructor) and
// holds no shared mutable state, so we build one per call — never a
// process-global singleton, which would be unsafe to share across
// concurrently-credentialed gateway requests.
export async function getClient(): Promise<TimeZestClient> {
  const creds = getCredentials();
  if (!creds) {
    throw new Error('No TimeZest API credentials configured. Set TIMEZEST_API_TOKEN environment variable.');
  }
  return new TimeZestClient({ apiToken: creds.apiToken });
}