import type { Agent } from './agents.js';
import type { Team } from './teams.js';

/**
 * Mixed resource type - can be either an agent or a team
 * This is returned by the /resources endpoint which provides
 * a heterogeneous list of both agents and teams
 */
export type Resource = (Agent & { type: 'agent' }) | (Team & { type: 'team' });

export interface ResourceListParams {
  /** Page size (default 20) */
  pageSize?: number;
  /** Starting cursor for pagination */
  startingAfter?: string;
  /** Ending cursor for pagination */
  endingBefore?: string;
  /** TQL filter string */
  filter?: string;
  /** Filter by resource type */
  type?: 'agent' | 'team';
}