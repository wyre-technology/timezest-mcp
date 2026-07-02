export interface AppointmentType {
  /** Unique appointment type identifier */
  id: string;
  /** Appointment type name */
  name: string;
  /** Appointment type description */
  description?: string;
  /** Default duration in minutes */
  duration: number;
  /** Whether this appointment type is active */
  active: boolean;
  /** Color hex code for calendar display */
  color?: string;
  /** Buffer time before appointment (minutes) */
  bufferBefore?: number;
  /** Buffer time after appointment (minutes) */
  bufferAfter?: number;
  /** Minimum advance notice required (minutes) */
  minAdvanceNotice?: number;
  /** Maximum advance notice allowed (days) */
  maxAdvanceNotice?: number;
  /** Working hours constraints */
  workingHours?: {
    /** Start time in HH:MM format */
    startTime: string;
    /** End time in HH:MM format */
    endTime: string;
    /** Days of week (0=Sunday, 6=Saturday) */
    daysOfWeek: number[];
    /** IANA timezone */
    timezone: string;
  };
  /** Created timestamp */
  createdAt: string;
  /** Last updated timestamp */
  updatedAt: string;
}

export interface AppointmentTypeListParams {
  /** Page size (default 20) */
  pageSize?: number;
  /** Starting cursor for pagination */
  startingAfter?: string;
  /** Ending cursor for pagination */
  endingBefore?: string;
  /** TQL filter string */
  filter?: string;
}