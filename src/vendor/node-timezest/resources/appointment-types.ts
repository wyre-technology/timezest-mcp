import type { HttpClient } from '../http.js';
import type { AppointmentType, AppointmentTypeListParams } from '../types/appointment-types.js';
import { unwrapResponse } from '../pagination.js';

export class AppointmentTypesResource {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * List all appointment types
   */
  async list(params: AppointmentTypeListParams = {}): Promise<AppointmentType[]> {
    const response = await this.httpClient.request<AppointmentType[] | { data: AppointmentType[] }>('/v1/appointment_types', {
      params: {
        page_size: params.pageSize,
        starting_after: params.startingAfter,
        ending_before: params.endingBefore,
        filter: params.filter,
      },
    });

    return unwrapResponse<AppointmentType>(response);
  }

  /**
   * Get a specific appointment type by ID
   */
  async get(id: string): Promise<AppointmentType> {
    return this.httpClient.request<AppointmentType>(`/v1/appointment_types/${id}`);
  }
}