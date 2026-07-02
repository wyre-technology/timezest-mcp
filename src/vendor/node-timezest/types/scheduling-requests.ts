import type { TriggerMode, DateTimeRange, PSAEntity, ContactInfo } from './common.js';

export interface SchedulingRequest {
  /** Unique scheduling request identifier */
  id: string;
  /** Appointment type ID */
  appointmentTypeId: string;
  /** Trigger mode - determines if this fires PSA workflow or generates URL */
  triggerMode: TriggerMode;
  /** End user contact information */
  endUser: ContactInfo;
  /** Preferred date/time ranges */
  timeRange: DateTimeRange;
  /** Specific resource IDs to book with (agents or teams) */
  resourceIds?: string[];
  /** Additional notes or requirements */
  notes?: string;
  /** PSA entities this request is associated with */
  associatedEntities?: PSAEntity[];
  /** Booking URL (present when triggerMode = 'generate_url') */
  bookingUrl?: string;
  /** Request status */
  status: 'pending' | 'booked' | 'cancelled' | 'completed';
  /** Scheduled date/time (when booked) */
  scheduledAt?: string;
  /** Assigned resource ID (when booked) */
  assignedResourceId?: string;
  /** Created timestamp */
  createdAt: string;
  /** Last updated timestamp */
  updatedAt: string;
}

export interface CreateSchedulingRequestData {
  /** Appointment type ID (required) */
  appointmentTypeId: string;
  /** Trigger mode (required) */
  triggerMode: TriggerMode;
  /** End user contact information */
  endUser: ContactInfo;
  /** Preferred date/time ranges */
  timeRange?: DateTimeRange;
  /** Specific resource IDs to book with */
  resourceIds?: string[];
  /** Additional notes or requirements */
  notes?: string;
  /** PSA entities this request is associated with */
  associatedEntities?: PSAEntity[];
}

export interface SchedulingRequestListParams {
  /** Page size (default 20) */
  pageSize?: number;
  /** Starting cursor for pagination */
  startingAfter?: string;
  /** Ending cursor for pagination */
  endingBefore?: string;
  /** TQL filter string */
  filter?: string;
  /** Filter by status */
  status?: SchedulingRequest['status'];
}

export interface CancelSchedulingRequestData {
  /** Reason for cancellation */
  reason?: string;
}