/**
 * Scheduling-request-card payload builder for the MCP Apps (SEP-1865) UI surface.
 *
 * timezest_scheduling_get results get a normalized `_card` object attached
 * (see domains/scheduling.ts) that the ui:// scheduling-request card renders
 * from. The card is progressive enhancement: every step here is best-effort,
 * and a null return simply means the host renders no card while the JSON
 * payload is unchanged.
 */
import type { TimeZestClient } from './vendor/node-timezest/index.js';

export const SCHEDULING_REQUEST_CARD_RESOURCE_URI = 'ui://timezest/scheduling-request-card.html';

/** MCP Apps resource MIME (RESOURCE_MIME_TYPE in @modelcontextprotocol/ext-apps). */
export const MCP_APP_RESOURCE_MIME = 'text/html;profile=mcp-app';

/**
 * Tool `_meta` advertising the card. Carries both the canonical flat key
 * (RESOURCE_URI_META_KEY in ext-apps) and the nested form ext-apps'
 * registerAppTool emits, so any MCP Apps host revision finds it.
 */
export const SCHEDULING_REQUEST_CARD_META = {
  'ui/resourceUri': SCHEDULING_REQUEST_CARD_RESOURCE_URI,
  ui: { resourceUri: SCHEDULING_REQUEST_CARD_RESOURCE_URI },
} as const;

/** Mirror of Brand in ui/scheduling-request-card.ts — keep in sync. */
export interface CardBrand {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  bg?: string;
  text?: string;
}

/** The brand-injection comment marker baked into the card HTML (see ui/index.html). */
const BRAND_INJECT_RE = /<!--\s*BRAND_INJECT:[\s\S]*?-->/;

/**
 * Serve-time brand injection: replace the injection marker with an inline
 * `window.__BRAND__` script so self-hosters can theme the card without
 * rebuilding the bundle. An empty brand returns the HTML unchanged (the card
 * renders its neutral defaults). `<` is escaped so brand values can never
 * break out of the script tag.
 */
export function applyBrandInjection(html: string, brand: CardBrand): string {
  if (!brand || Object.values(brand).every((v) => !v)) return html;
  const json = JSON.stringify(brand).replace(/</g, '\\u003c');
  return html.replace(BRAND_INJECT_RE, `<script>window.__BRAND__=${json}</script>`);
}

/**
 * Resolve brand overrides from MCP_BRAND_* environment variables. Guarded for
 * runtimes without `process`, where this returns an empty brand and the card
 * serves its neutral defaults.
 */
export function resolveBrandFromEnv(): CardBrand {
  if (typeof process === 'undefined' || !process.env) return {};
  const env = process.env;
  const brand: CardBrand = {};
  if (env.MCP_BRAND_NAME) brand.name = env.MCP_BRAND_NAME;
  if (env.MCP_BRAND_LOGO_URL) brand.logoUrl = env.MCP_BRAND_LOGO_URL;
  if (env.MCP_BRAND_PRIMARY_COLOR) brand.primaryColor = env.MCP_BRAND_PRIMARY_COLOR;
  if (env.MCP_BRAND_ACCENT_COLOR) brand.accentColor = env.MCP_BRAND_ACCENT_COLOR;
  if (env.MCP_BRAND_BG) brand.bg = env.MCP_BRAND_BG;
  if (env.MCP_BRAND_TEXT) brand.text = env.MCP_BRAND_TEXT;
  return brand;
}

/** Mirror of SchedulingRequestCard in ui/scheduling-request-card.ts — keep in sync. */
export interface SchedulingRequestCard {
  id: string;
  /** Appointment type name when resolvable, else a generic heading. */
  title: string;
  status: string;
  /** Trigger-mode label resolved server-side ("PSA workflow" / "Booking link"). */
  mode?: string;
  customer?: string;
  company?: string;
  email?: string;
  /** Resolved agent/team name for the booked resource, falling back to #id. */
  assignedTo?: string;
  /** Preferred scheduling window, preformatted ("2024-02-01 09:00 → 17:00 (TZ)"). */
  window?: string;
  duration?: string;
  scheduledAt?: string;
  createdAt?: string;
  /** Present only for http(s) URLs — never other schemes. */
  bookingUrl?: string;
  notes?: string;
  /** PSA associations resolved to flat labels ("ConnectWise #T20240001"). */
  psaTickets: string[];
}

const CARD_NOTES_MAX_LENGTH = 500;

const MODE_LABELS: Record<string, string> = {
  pod: 'PSA workflow',
  generate_url: 'Booking link',
};

const PSA_LABELS: Record<string, string> = {
  connectwise: 'ConnectWise',
  autotask: 'Autotask',
  halo: 'Halo',
};

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

/** Format the preferred scheduling window from TimeZest's plain date/time strings. */
function formatWindow(timeRange: unknown): string | undefined {
  if (!timeRange || typeof timeRange !== 'object') return undefined;
  const range = timeRange as Record<string, unknown>;
  const start = [asString(range.earliestDate), asString(range.earliestTime)].filter(Boolean).join(' ');
  const end = [asString(range.latestDate), asString(range.latestTime)].filter(Boolean).join(' ');
  let window = start && end ? `${start} → ${end}` : start || end;
  if (!window) return undefined;
  const timezone = asString(range.timezone);
  if (timezone) window += ` (${timezone})`;
  return window;
}

/**
 * Build the renderable card from a timezest_scheduling_get payload. IDs are
 * resolved to display names server-side using only lookups the client already
 * has (appointmentTypes.get, agents.get, teams.get); every lookup is
 * best-effort and falls back to a #id label.
 */
export async function buildSchedulingRequestCard(
  request: Record<string, unknown>,
  client: Pick<TimeZestClient, 'appointmentTypes' | 'agents' | 'teams'>
): Promise<SchedulingRequestCard | null> {
  if (typeof request?.id !== 'string' || !request.id || typeof request.status !== 'string') {
    return null;
  }

  const card: SchedulingRequestCard = {
    id: request.id,
    title: 'Scheduling request',
    status: request.status,
    psaTickets: [],
  };

  const mode = asString(request.triggerMode);
  if (mode) card.mode = MODE_LABELS[mode] ?? mode;

  const endUser = (request.endUser ?? {}) as Record<string, unknown>;
  const customer = asString(endUser.name);
  const company = asString(endUser.company);
  const email = asString(endUser.email);
  if (customer) card.customer = customer;
  if (company) card.company = company;
  if (email) card.email = email;

  const window = formatWindow(request.timeRange);
  if (window) card.window = window;
  const scheduledAt = asString(request.scheduledAt);
  if (scheduledAt) card.scheduledAt = scheduledAt;
  const createdAt = asString(request.createdAt);
  if (createdAt) card.createdAt = createdAt;

  const notes = asString(request.notes);
  if (notes) card.notes = notes.slice(0, CARD_NOTES_MAX_LENGTH);

  // Only ever surface http(s) booking URLs — vendor data is untrusted.
  const bookingUrl = asString(request.bookingUrl);
  if (bookingUrl && /^https?:\/\//i.test(bookingUrl)) card.bookingUrl = bookingUrl;

  if (Array.isArray(request.associatedEntities)) {
    card.psaTickets = request.associatedEntities
      .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
      .map((e) => {
        const label = PSA_LABELS[String(e.type)] ?? String(e.type ?? 'PSA');
        const ref = asString(e.number) ?? (e.id != null ? String(e.id) : '');
        return ref ? `${label} #${ref}` : label;
      });
  }

  // Resolve the appointment type to a human-readable heading (best-effort).
  const appointmentTypeId = asString(request.appointmentTypeId);
  if (appointmentTypeId) {
    card.title = `Appointment type #${appointmentTypeId}`;
    try {
      const type = await client.appointmentTypes.get(appointmentTypeId);
      if (type?.name) {
        card.title = type.name;
        if (typeof type.duration === 'number') card.duration = `${type.duration} min`;
      }
    } catch {
      // Best-effort: keep the #id heading rather than failing the tool.
    }
  }

  // Resolve the booked resource — TimeZest resource ids may be an agent or a
  // team, so try both single-entity lookups the client already has.
  const assignedResourceId = asString(request.assignedResourceId);
  if (assignedResourceId) {
    card.assignedTo = `#${assignedResourceId}`;
    try {
      const agent = await client.agents.get(assignedResourceId);
      if (agent?.name) card.assignedTo = agent.name;
    } catch {
      try {
        const team = await client.teams.get(assignedResourceId);
        if (team?.name) card.assignedTo = team.name;
      } catch {
        // Best-effort: keep the #id label.
      }
    }
  }

  return card;
}
