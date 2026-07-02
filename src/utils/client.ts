/**
 * Client singleton with credential management
 */
import { TimeZestClient } from '../vendor/node-timezest/index.js';
import { logger } from './logger.js';

interface Credentials {
  apiToken: string;
}

let _client: TimeZestClient | null = null;
let _credentials: Credentials | null = null;

function getCredentials(): Credentials | null {
  const apiToken = process.env.TIMEZEST_API_TOKEN;

  if (!apiToken) {
    logger.debug('No TimeZest API token found in environment');
    return null;
  }

  return { apiToken };
}

export async function getClient(): Promise<TimeZestClient> {
  const creds = getCredentials();
  if (!creds) {
    throw new Error('No TimeZest API credentials configured. Set TIMEZEST_API_TOKEN environment variable.');
  }

  // Invalidate cache if credentials changed (gateway injects per-request)
  if (_client && _credentials && creds.apiToken !== _credentials.apiToken) {
    logger.debug('Credentials changed, resetting client');
    _client = null;
  }

  if (!_client) {
    logger.debug('Creating new TimeZest client');
    _client = new TimeZestClient({
      apiToken: creds.apiToken,
    });
    _credentials = creds;
  }

  return _client;
}

export function resetClient(): void {
  logger.debug('Resetting TimeZest client');
  _client = null;
  _credentials = null;
}