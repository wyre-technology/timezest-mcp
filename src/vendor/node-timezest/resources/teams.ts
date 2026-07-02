import type { HttpClient } from '../http.js';
import type { Team, TeamListParams } from '../types/teams.js';
import { unwrapResponse } from '../pagination.js';

export class TeamsResource {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * List all teams
   */
  async list(params: TeamListParams = {}): Promise<Team[]> {
    const response = await this.httpClient.request<Team[] | { data: Team[] }>('/v1/teams', {
      params: {
        page_size: params.pageSize,
        starting_after: params.startingAfter,
        ending_before: params.endingBefore,
        filter: params.filter,
      },
    });

    return unwrapResponse<Team>(response);
  }

  /**
   * Get a specific team by ID
   */
  async get(id: string): Promise<Team> {
    return this.httpClient.request<Team>(`/v1/teams/${id}`);
  }
}