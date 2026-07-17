/**
 * MCP protocol resource handlers (resources/list, resources/read).
 *
 * Exposes the MCP Apps (SEP-1865) scheduling-request-card UI. Not to be
 * confused with src/domains/resources.ts, which is the TimeZest "resources"
 * tool domain (bookable agents + teams).
 *
 * The card HTML is embedded at build time
 * (src/generated/scheduling-request-card-html.ts) so it serves identically
 * from stdio and Node HTTP transports without filesystem access.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  SCHEDULING_REQUEST_CARD_RESOURCE_URI,
  MCP_APP_RESOURCE_MIME,
  applyBrandInjection,
  resolveBrandFromEnv,
} from './card.builder.js';
import { SCHEDULING_REQUEST_CARD_HTML } from './generated/scheduling-request-card-html.js';

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface McpResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

export function listResources(): McpResource[] {
  return [
    {
      uri: SCHEDULING_REQUEST_CARD_RESOURCE_URI,
      name: 'TimeZest Scheduling Request Card',
      description: 'Interactive MCP Apps card rendering a TimeZest scheduling request',
      mimeType: MCP_APP_RESOURCE_MIME,
    },
  ];
}

export function readResource(uri: string): McpResourceContent {
  if (uri === SCHEDULING_REQUEST_CARD_RESOURCE_URI) {
    return {
      uri,
      mimeType: MCP_APP_RESOURCE_MIME,
      // Neutral by default; MCP_BRAND_* env vars inject a per-operator brand
      // at serve time (no rebuild needed). Empty brand = HTML served as-is.
      text: applyBrandInjection(SCHEDULING_REQUEST_CARD_HTML, resolveBrandFromEnv()),
    };
  }
  throw new Error(`Unknown resource: ${uri}`);
}

export function registerResourceHandlers(server: Server): void {
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: listResources(),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => ({
    contents: [readResource(request.params.uri)],
  }));
}
