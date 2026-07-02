/**
 * Vendored copy of @wyre-technology/node-timezest (v1.0.1).
 *
 * This is the TimeZest API client, copied in-repo to remove timezest-mcp's
 * dependency on the private GitHub Packages registry. Keep in sync with the
 * upstream source at https://github.com/wyre-technology/node-timezest.
 *
 * Copyright WYRE Technology. Licensed under Apache-2.0 (see repo LICENSE).
 */

// Main client
export { TimeZestClient } from './client.js';

// Configuration
export type { TimeZestConfig } from './config.js';
export { DEFAULT_CONFIG } from './config.js';

// Types
export * from './types/index.js';

// Errors
export {
  ServiceError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
} from './errors.js';

// Utilities
export { unwrapResponse } from './pagination.js';