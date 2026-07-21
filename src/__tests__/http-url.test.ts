/**
 * URL construction contract for the vendored TimeZest HTTP client.
 *
 * These assertions exist because `new URL(relative, base)` performs RFC 3986
 * relative resolution, not concatenation: any reference starting with '/' is
 * path-absolute and discards the base's own path. A baseUrl carrying a path
 * prefix (a gateway/proxy mount such as https://host/timezest/v1) must survive
 * into the request URL.
 *
 * Exercised through the public surface — HttpClient.request() with a stubbed
 * global fetch — rather than reaching into the private buildUrl(), so the test
 * pins the URL the client actually hands to fetch.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { HttpClient } from '../vendor/node-timezest/http.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Issue one request and return the URL the client passed to fetch. */
async function requestedUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, unknown>
): Promise<string> {
  const fetchMock = vi.fn(
    async () =>
      new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
  );
  vi.stubGlobal('fetch', fetchMock);

  const client = new HttpClient({ apiToken: 'test-token', baseUrl });
  await client.request(path, { params });

  expect(fetchMock).toHaveBeenCalledTimes(1);
  return String(fetchMock.mock.calls[0]![0]);
}

describe('HttpClient URL construction', () => {
  describe('bare-origin base (the default)', () => {
    it('appends the path to the origin', async () => {
      expect(await requestedUrl('https://api.timezest.com', '/agents')).toBe(
        'https://api.timezest.com/agents/'
      );
    });

    it('tolerates a trailing slash on the base', async () => {
      expect(await requestedUrl('https://api.timezest.com/', '/agents')).toBe(
        'https://api.timezest.com/agents/'
      );
    });

    it('tolerates a path with no leading slash', async () => {
      expect(await requestedUrl('https://api.timezest.com', 'agents')).toBe(
        'https://api.timezest.com/agents/'
      );
    });
  });

  describe('base with a path prefix', () => {
    it('preserves the prefix for a leading-slash path', async () => {
      expect(await requestedUrl('https://gateway.example.com/timezest/v1', '/agents')).toBe(
        'https://gateway.example.com/timezest/v1/agents/'
      );
    });

    it('preserves the prefix when the base has a trailing slash', async () => {
      expect(await requestedUrl('https://gateway.example.com/timezest/v1/', '/agents')).toBe(
        'https://gateway.example.com/timezest/v1/agents/'
      );
    });

    it('preserves the prefix when the path has no leading slash', async () => {
      expect(await requestedUrl('https://gateway.example.com/timezest/v1', 'agents')).toBe(
        'https://gateway.example.com/timezest/v1/agents/'
      );
    });

    it('preserves the prefix for multi-segment paths', async () => {
      expect(
        await requestedUrl('https://gateway.example.com/timezest/v1', '/scheduling_requests/sr_123')
      ).toBe('https://gateway.example.com/timezest/v1/scheduling_requests/sr_123/');
    });

    it('preserves a single-segment prefix', async () => {
      expect(await requestedUrl('https://example.com/api', '/teams')).toBe(
        'https://example.com/api/teams/'
      );
    });
  });

  describe('trailing slash on the path', () => {
    it('is added when missing', async () => {
      expect(await requestedUrl('https://api.timezest.com', '/agents')).toMatch(/\/agents\/$/);
    });

    it('is not doubled when already present', async () => {
      expect(await requestedUrl('https://api.timezest.com', '/agents/')).toBe(
        'https://api.timezest.com/agents/'
      );
      expect(await requestedUrl('https://gateway.example.com/timezest/v1/', '/agents/')).toBe(
        'https://gateway.example.com/timezest/v1/agents/'
      );
    });
  });

  describe('query params', () => {
    it('appends params after the path', async () => {
      expect(
        await requestedUrl('https://api.timezest.com', '/agents', { page: 1, page_size: 25 })
      ).toBe('https://api.timezest.com/agents/?page=1&page_size=25');
    });

    it('appends params to a prefixed base', async () => {
      expect(
        await requestedUrl('https://gateway.example.com/timezest/v1', '/agents', { page: 2 })
      ).toBe('https://gateway.example.com/timezest/v1/agents/?page=2');
    });

    it('skips undefined and null values', async () => {
      expect(
        await requestedUrl('https://api.timezest.com', '/agents', {
          page: 1,
          cursor: undefined,
          filter: null,
        })
      ).toBe('https://api.timezest.com/agents/?page=1');
    });
  });
});
