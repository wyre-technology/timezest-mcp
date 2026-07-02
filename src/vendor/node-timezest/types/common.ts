/**
 * Common types used across TimeZest API
 */

export type TriggerMode = 'pod' | 'generate_url';

export interface DateTimeRange {
  /** Earliest date in YYYY-MM-DD format */
  earliestDate?: string;
  /** Earliest time in HH:MM format */
  earliestTime?: string;
  /** Latest date in YYYY-MM-DD format */
  latestDate?: string;
  /** Latest time in HH:MM format */
  latestTime?: string;
  /** IANA timezone (e.g., 'America/New_York') - CRITICAL: preserved as string */
  timezone?: string;
}

export interface PSAEntity {
  /** PSA system type */
  type: 'connectwise' | 'autotask' | 'halo';
  /** Entity ID in the PSA system */
  id: string | number;
  /** Entity number/reference (if applicable) */
  number?: string;
}

export interface ContactInfo {
  /** Contact name */
  name?: string;
  /** Contact email address */
  email?: string;
  /** Contact phone number */
  phone?: string;
  /** Company/organization name */
  company?: string;
}