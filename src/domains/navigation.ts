/**
 * Decision-tree navigation tools
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DomainHandler, CallToolResult } from '../utils/types.js';
import { logger } from '../utils/logger.js';

const DOMAINS = [
  { id: 'agents', name: 'Agents', description: 'Individual technicians available for booking' },
  { id: 'teams', name: 'Teams', description: 'Team-based scheduling (round-robin, shared pools)' },
  { id: 'appointment_types', name: 'Appointment Types', description: 'Available appointment/service types' },
  { id: 'resources', name: 'Resources', description: 'All available resources (agents + teams)' },
  { id: 'scheduling', name: 'Scheduling', description: 'Create, view, and manage scheduling requests' },
] as const;

function getTools(): Tool[] {
  return [
    {
      name: 'timezest_navigate',
      description: 'Navigate to a specific TimeZest domain to access its tools',
      inputSchema: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            enum: DOMAINS.map(d => d.id),
            description: 'Domain to navigate to',
          },
        },
        required: ['domain'],
      },
    },
    {
      name: 'timezest_status',
      description: 'Show current navigation state and available domains',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];
}

async function handleCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  switch (toolName) {
    case 'timezest_navigate': {
      const domain = args.domain as string;
      const targetDomain = DOMAINS.find(d => d.id === domain);

      if (!targetDomain) {
        return {
          content: [{ type: 'text', text: `Invalid domain: ${domain}` }],
          isError: true,
        };
      }

      logger.info('Navigating to domain', { domain });

      return {
        content: [{
          type: 'text',
          text: `Navigated to ${targetDomain.name}. ${targetDomain.description}\n\nUse the domain-specific tools now available to perform operations.`,
        }],
      };
    }

    case 'timezest_status': {
      const domainList = DOMAINS
        .map(d => `• ${d.id} - ${d.name}: ${d.description}`)
        .join('\n');

      return {
        content: [{
          type: 'text',
          text: `TimeZest MCP Server Status

Available domains:
${domainList}

Use "timezest_navigate" to enter a domain and access its tools.`,
        }],
      };
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
        isError: true,
      };
  }
}

export const navigationHandler: DomainHandler = { getTools, handleCall };