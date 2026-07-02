import type { HttpClient } from '../http.js';
import type { Agent, AgentListParams } from '../types/agents.js';
import { unwrapResponse } from '../pagination.js';

export class AgentsResource {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * List all agents
   */
  async list(params: AgentListParams = {}): Promise<Agent[]> {
    const response = await this.httpClient.request<Agent[] | { data: Agent[] }>('/v1/agents', {
      params: {
        page_size: params.pageSize,
        starting_after: params.startingAfter,
        ending_before: params.endingBefore,
        filter: params.filter,
      },
    });

    return unwrapResponse<Agent>(response);
  }

  /**
   * Get a specific agent by ID
   */
  async get(id: string): Promise<Agent> {
    return this.httpClient.request<Agent>(`/v1/agents/${id}`);
  }
}