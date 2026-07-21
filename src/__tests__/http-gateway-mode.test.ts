/**
 * Gateway-mode header wiring for the HTTP transport.
 *
 * Before this fix, startHttpServer never read any request header at all —
 * AUTH_MODE=gateway was checked only deep inside createMcpServer(), which
 * re-read process.env.TIMEZEST_API_TOKEN (never set per request). This pins
 * that the X-Timezest-Api-Token header is actually extracted and threaded
 * into the request-scoped credential store that utils/client.ts reads from.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import http from 'http';
import type { AddressInfo } from 'net';

const runWithCredentialsSpy = vi.fn((creds: unknown, fn: () => unknown) => fn());

vi.mock('../server.js', () => ({
  createMcpServer: () => ({
    connect: vi.fn(async () => {}),
    close: vi.fn(),
  }),
}));

vi.mock('../utils/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/client.js')>();
  return { ...actual, runWithCredentials: runWithCredentialsSpy };
});

// StreamableHTTPServerTransport.handleRequest needs a real request/response
// pair; stub it to a no-op so this test stays scoped to header extraction,
// not full MCP protocol framing.
vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: class {
    close = vi.fn();
    handleRequest = vi.fn((_req: unknown, res: http.ServerResponse) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
  },
}));

async function postToMcp(port: number, headers: Record<string, string> = {}): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, path: '/mcp', method: 'POST', headers },
      (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      }
    );
    req.on('error', reject);
    req.end('{}');
  });
}

describe('startHttpServer — gateway mode credential wiring', () => {
  let server: http.Server;
  let port: number;
  const originalAuthMode = process.env.AUTH_MODE;

  beforeEach(async () => {
    runWithCredentialsSpy.mockClear();
    process.env.AUTH_MODE = 'gateway';
    vi.resetModules();
    const { startHttpServer } = await import('../http.js');
    server = startHttpServer(0);
    await new Promise<void>((resolve) => server.once('listening', resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterEach(async () => {
    if (originalAuthMode === undefined) delete process.env.AUTH_MODE;
    else process.env.AUTH_MODE = originalAuthMode;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('threads X-Timezest-Api-Token into runWithCredentials', async () => {
    await postToMcp(port, { 'x-timezest-api-token': 'gw-token-123' });
    expect(runWithCredentialsSpy).toHaveBeenCalledWith({ apiToken: 'gw-token-123' }, expect.any(Function));
  });

  it('does not call runWithCredentials when the header is absent', async () => {
    await postToMcp(port, {});
    expect(runWithCredentialsSpy).not.toHaveBeenCalled();
  });
});
