import type { Tool, TextContent, ImageContent } from '@modelcontextprotocol/sdk/types.js';

export interface CallToolResult {
  content: Array<TextContent | ImageContent>;
  isError?: boolean;
}

export interface RequestHandlerExtra {
  requestId?: string;
  serverRef?: any;
}

export interface DomainHandler {
  getTools(): Tool[];
  handleCall(
    toolName: string,
    args: Record<string, unknown>,
    extra?: RequestHandlerExtra
  ): Promise<CallToolResult>;
}