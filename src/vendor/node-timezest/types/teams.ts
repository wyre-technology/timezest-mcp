export interface Team {
  /** Unique team identifier */
  id: string;
  /** Team name */
  name: string;
  /** Team description */
  description?: string;
  /** Whether the team is active */
  active: boolean;
  /** Team's IANA timezone */
  timezone: string;
  /** List of agent IDs in this team */
  agentIds: string[];
  /** Round-robin scheduling settings */
  scheduling?: {
    /** Scheduling method (round-robin, load-balanced, etc.) */
    method: string;
    /** Whether to respect agent availability */
    respectAvailability: boolean;
  };
  /** Created timestamp */
  createdAt: string;
  /** Last updated timestamp */
  updatedAt: string;
}

export interface TeamListParams {
  /** Page size (default 20) */
  pageSize?: number;
  /** Starting cursor for pagination */
  startingAfter?: string;
  /** Ending cursor for pagination */
  endingBefore?: string;
  /** TQL filter string */
  filter?: string;
}