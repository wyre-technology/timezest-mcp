export interface TimeZestConfig {
  /** TimeZest API token */
  apiToken: string;
  /** Base URL for the TimeZest API (defaults to https://api.timezest.com) */
  baseUrl?: string;
  /** Request timeout in milliseconds (defaults to 30000) */
  timeout?: number;
  /** Maximum number of retries for failed requests (defaults to 3) */
  maxRetries?: number;
  /** Rate limit - requests per second (defaults to 10) */
  rateLimit?: number;
}

export const DEFAULT_CONFIG: Partial<TimeZestConfig> = {
  baseUrl: 'https://api.timezest.com',
  timeout: 30000,
  maxRetries: 3,
  rateLimit: 10,
} as const;