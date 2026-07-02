export interface Agent {
  /** Unique agent identifier */
  id: string;
  /** Agent name */
  name: string;
  /** Agent email address */
  email: string;
  /** Whether the agent is active */
  active: boolean;
  /** Agent's IANA timezone */
  timezone: string;
  /** Agent's role or title */
  role?: string;
  /** Agent's department */
  department?: string;
  /** Created timestamp */
  createdAt: string;
  /** Last updated timestamp */
  updatedAt: string;
}

export interface AgentListParams {
  /** Page size (default 20) */
  pageSize?: number;
  /** Starting cursor for pagination */
  startingAfter?: string;
  /** Ending cursor for pagination */
  endingBefore?: string;
  /** TQL filter string */
  filter?: string;
}