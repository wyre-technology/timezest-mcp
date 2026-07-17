/**
 * MCP server setup, tool routing, and capabilities
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { navigationHandler, getDomainHandler } from './domains/index.js';
import { registerResourceHandlers } from './resources.js';
import { setServerRef } from './utils/server-ref.js';
import { resetClient } from './utils/client.js';
import { logger } from './utils/logger.js';

// Navigation state
let currentDomain: string | null = null;

function isGatewayMode(): boolean {
  return process.env.AUTH_MODE === 'gateway';
}

export function createMcpServer(): Server {
  const server = new Server(
    { name: 'timezest-mcp', version: '0.1.0' },
    { capabilities: { tools: {}, resources: {} } }
  );

  // Set server reference for elicitation
  setServerRef(server);

  // MCP Apps (SEP-1865): serve the ui:// scheduling-request card resource
  registerResourceHandlers(server);

  // Handle gateway mode credentials
  if (isGatewayMode()) {
    // In gateway mode, credentials are injected per request via headers
    // The gateway should set TIMEZEST_API_TOKEN environment variable
    const apiToken = process.env.TIMEZEST_API_TOKEN;
    if (apiToken) {
      resetClient(); // Reset client to pick up new credentials
      logger.debug('Gateway mode: API token available');
    } else {
      logger.debug('Gateway mode: No API token in environment');
    }
  }

  server.setRequestHandler(CallToolRequestSchema, async (request, _extra): Promise<any> => {
    const { name, arguments: args } = request.params;

    logger.debug('Tool call', { name, currentDomain });

    try {
      // Handle navigation tools
      if (name.startsWith('timezest_navigate') || name === 'timezest_status') {
        const result = await navigationHandler.handleCall(name, args || {});

        // Update navigation state
        if (name === 'timezest_navigate' && !result.isError) {
          const domain = (args as any)?.domain;
          if (domain) {
            currentDomain = domain;
            server.sendToolListChanged();
            logger.debug('Navigated to domain', { domain });
          }
        }

        return result;
      }

      // Handle back navigation
      if (name === 'timezest_back') {
        currentDomain = null;
        server.sendToolListChanged();
        logger.debug('Returned to navigation');
        return {
          content: [{
            type: 'text',
            text: 'Returned to main navigation. Use "timezest_status" to see available domains.',
          }],
        };
      }

      // Handle domain-specific tools
      if (currentDomain) {
        const handler = await getDomainHandler(currentDomain);
        if (handler) {
          return await handler.handleCall(name, args || {});
        }
      }

      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    } catch (error) {
      logger.error('Tool call failed', { name, error });
      return {
        content: [{
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        }],
        isError: true,
      };
    }
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Tools list requested', { currentDomain });

    let tools = navigationHandler.getTools();

    // Add domain-specific tools if in a domain
    if (currentDomain) {
      const handler = await getDomainHandler(currentDomain);
      if (handler) {
        tools = [...tools, ...handler.getTools()];
      }
    }

    return { tools };
  });

  return server;
}