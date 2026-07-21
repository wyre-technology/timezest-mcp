import {
  ServiceError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
} from './errors.js';
import { RateLimiter } from './rate-limiter.js';
import type { TimeZestConfig } from './config.js';

export interface RequestOptions {
  method?: string;
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

export class HttpClient {
  private readonly rateLimiter: RateLimiter;
  private readonly baseUrl: string;

  constructor(private readonly config: TimeZestConfig) {
    this.baseUrl = config.baseUrl!.replace(/\/$/, ''); // Remove trailing slash
    this.rateLimiter = new RateLimiter(
      config.rateLimit || 10,
      config.rateLimit || 10
    );
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    await this.rateLimiter.acquire();

    const url = this.buildUrl(path, options.params);
    const requestOptions = this.buildRequestOptions(options);

    let lastError: Error | null = null;
    const maxRetries = this.config.maxRetries || 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof ValidationError || error instanceof NotFoundError) {
          throw error;
        }

        // Don't retry on auth errors
        if (error instanceof AuthenticationError || error instanceof ForbiddenError) {
          throw error;
        }

        // Retry on rate limits and server errors
        if (attempt < maxRetries && (error instanceof RateLimitError || error instanceof ServerError)) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    // Join base and path explicitly. `new URL(relative, base)` performs RFC 3986
    // relative resolution rather than concatenation: a reference starting with
    // '/' is path-absolute and REPLACES the base's own path, so a baseUrl such
    // as 'https://gateway.example.com/timezest/v1' would silently lose its
    // '/timezest/v1' prefix.
    const normalizedBase = this.baseUrl.replace(/\/+$/, '');
    // Trim surrounding slashes; the API expects a trailing slash on the path.
    const normalizedPath = path.replace(/^\/+/, '').replace(/\/+$/, '');

    const url = new URL(
      normalizedPath ? `${normalizedBase}/${normalizedPath}/` : `${normalizedBase}/`
    );

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private buildRequestOptions(options: RequestOptions): RequestInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiToken}`,
      'User-Agent': '@wyre-technology/node-timezest',
      ...options.headers,
    };

    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    };

    if (options.body && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
      requestOptions.body = JSON.stringify(options.body);
    }

    return requestOptions;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // CRITICAL: Read response body as text first, then parse JSON
    // This prevents "Body already read" errors if we need to read it again
    const responseText = await response.text();
    let responseBody: unknown;

    try {
      responseBody = responseText ? JSON.parse(responseText) : {};
    } catch {
      responseBody = responseText;
    }

    if (response.ok) {
      if (response.status === 204) {
        return {} as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return responseBody as T;
      }

      return {} as T;
    }

    // Handle error responses
    const message = this.extractErrorMessage(responseBody);

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message || 'Authentication failed', responseBody);
      case 403:
        throw new ForbiddenError(message || 'Access forbidden', responseBody);
      case 404:
        throw new NotFoundError(message || 'Resource not found', responseBody);
      case 400:
        const errors = this.extractValidationErrors(responseBody);
        throw new ValidationError(message || 'Validation failed', errors, responseBody);
      case 429:
        const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
        throw new RateLimitError(message || 'Rate limit exceeded', retryAfter, responseBody);
      default:
        if (response.status >= 500) {
          throw new ServerError(message || 'Server error', response.status, responseBody);
        }
        throw new ServiceError(message || 'Request failed', response.status, responseBody);
    }
  }

  private extractErrorMessage(responseBody: unknown): string | null {
    if (typeof responseBody === 'string') {
      return responseBody;
    }

    if (typeof responseBody === 'object' && responseBody !== null) {
      const body = responseBody as Record<string, unknown>;
      return (body.message || body.error || body.detail) as string | null;
    }

    return null;
  }

  private extractValidationErrors(responseBody: unknown): Array<{ field: string; message: string }> {
    if (typeof responseBody === 'object' && responseBody !== null) {
      const body = responseBody as Record<string, unknown>;

      // Handle various error formats
      if (Array.isArray(body.errors)) {
        return body.errors.map((error: any) => ({
          field: error.field || error.path || 'unknown',
          message: error.message || error.error || String(error),
        }));
      }

      if (typeof body.errors === 'object' && body.errors !== null) {
        return Object.entries(body.errors).map(([field, message]) => ({
          field,
          message: String(message),
        }));
      }
    }

    return [];
  }
}