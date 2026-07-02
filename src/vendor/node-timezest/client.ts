import { HttpClient } from './http.js';
import { AgentsResource } from './resources/agents.js';
import { TeamsResource } from './resources/teams.js';
import { AppointmentTypesResource } from './resources/appointment-types.js';
import { ResourcesResource } from './resources/resources.js';
import { SchedulingRequestsResource } from './resources/scheduling-requests.js';
import type { TimeZestConfig } from './config.js';
import { DEFAULT_CONFIG } from './config.js';

export class TimeZestClient {
  private readonly httpClient: HttpClient;

  public readonly agents: AgentsResource;
  public readonly teams: TeamsResource;
  public readonly appointmentTypes: AppointmentTypesResource;
  public readonly resources: ResourcesResource;
  public readonly schedulingRequests: SchedulingRequestsResource;

  constructor(config: TimeZestConfig) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    if (!mergedConfig.apiToken) {
      throw new Error('TimeZest API token is required');
    }

    this.httpClient = new HttpClient(mergedConfig);

    // Initialize resource classes
    this.agents = new AgentsResource(this.httpClient);
    this.teams = new TeamsResource(this.httpClient);
    this.appointmentTypes = new AppointmentTypesResource(this.httpClient);
    this.resources = new ResourcesResource(this.httpClient);
    this.schedulingRequests = new SchedulingRequestsResource(this.httpClient);
  }

  /**
   * Test API connectivity and authentication
   */
  async ping(): Promise<{ status: 'ok'; timestamp: string }> {
    // Use agents list as a health check - should work with any valid token
    await this.agents.list({ pageSize: 1 });
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}