/**
 * Domain registry with lazy loading
 */
import type { DomainHandler } from '../utils/types.js';

// Navigation is always available
export { navigationHandler } from './navigation.js';

// Lazy-loaded domain handlers
const domainHandlers = new Map<string, DomainHandler>();

export async function getDomainHandler(domain: string): Promise<DomainHandler | null> {
  if (domainHandlers.has(domain)) {
    return domainHandlers.get(domain)!;
  }

  // Lazy load domain handlers using dynamic imports
  switch (domain) {
    case 'agents': {
      if (!domainHandlers.has(domain)) {
        const { agentsHandler } = await import('./agents.js');
        domainHandlers.set(domain, agentsHandler);
      }
      return domainHandlers.get(domain)!;
    }
    case 'teams': {
      if (!domainHandlers.has(domain)) {
        const { teamsHandler } = await import('./teams.js');
        domainHandlers.set(domain, teamsHandler);
      }
      return domainHandlers.get(domain)!;
    }
    case 'appointment_types': {
      if (!domainHandlers.has(domain)) {
        const { appointmentTypesHandler } = await import('./appointment-types.js');
        domainHandlers.set(domain, appointmentTypesHandler);
      }
      return domainHandlers.get(domain)!;
    }
    case 'resources': {
      if (!domainHandlers.has(domain)) {
        const { resourcesHandler } = await import('./resources.js');
        domainHandlers.set(domain, resourcesHandler);
      }
      return domainHandlers.get(domain)!;
    }
    case 'scheduling': {
      if (!domainHandlers.has(domain)) {
        const { schedulingHandler } = await import('./scheduling.js');
        domainHandlers.set(domain, schedulingHandler);
      }
      return domainHandlers.get(domain)!;
    }
    default:
      return null;
  }
}