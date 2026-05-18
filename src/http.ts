/**
 * HTTP streaming transport for Node.js (per-request pattern)
 */
import http from 'http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server.js';
import { logger } from './utils/logger.js';

export function startHttpServer(port: number): http.Server {
  const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/mcp') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    // CRITICAL: Create fresh server and transport per request for gateway mode
    const mcpServer = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // STATELESS
      enableJsonResponse: true,
    });

    // Clean up when request ends
    res.on('close', () => {
      transport.close();
      mcpServer.close();
    });

    try {
      await mcpServer.connect(transport);
      transport.handleRequest(req, res);
    } catch (error) {
      logger.error('MCP transport error', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null,
        }));
      }
    }
  });

  server.listen(port, () => {
    logger.info(`TimeZest MCP server listening on port ${port}`);
  });

  return server;
}