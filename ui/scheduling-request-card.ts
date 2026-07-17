/**
 * Iframe bridge + renderer for the TimeZest scheduling-request card
 * (MCP Apps, SEP-1865).
 *
 * Runs inside the host's sandboxed iframe. Uses the official MCP Apps client
 * (`App`) to receive the tool result from the host. The card is read-only —
 * TimeZest write actions (create/cancel) stay in the conversation, so the
 * card never calls back into the server.
 *
 * The server attaches a normalized `_card` payload to timezest_scheduling_get
 * results (see src/card.builder.ts) so this renderer never needs to resolve
 * ids or entity names itself.
 *
 * Rendering uses DOM construction (no innerHTML) — customer names, notes, and
 * every other field are untrusted vendor data, so text only ever lands in
 * text nodes.
 *
 * White-label: the card is neutral by default (no vendor identity) and applies
 * an injected `window.__BRAND__` override (set by the MCP server via
 * MCP_BRAND_* env vars, or a gateway per-org) so the same card can render in
 * any operator's brand.
 */
import { App } from "@modelcontextprotocol/ext-apps";

interface Brand {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  bg?: string;
  text?: string;
}
declare global {
  interface Window {
    __BRAND__?: Brand;
  }
}

/** Mirror of SchedulingRequestCard in src/card.builder.ts — keep in sync. */
interface SchedulingRequestCard {
  id: string;
  title: string;
  status: string;
  mode?: string;
  customer?: string;
  company?: string;
  email?: string;
  assignedTo?: string;
  window?: string;
  duration?: string;
  scheduledAt?: string;
  createdAt?: string;
  bookingUrl?: string;
  notes?: string;
  psaTickets: string[];
}

const brand: Brand = window.__BRAND__ ?? {};
const brandName = brand.name ?? "";

// Apply any injected brand overrides onto the CSS custom properties.
function applyBrand(): void {
  const root = document.documentElement.style;
  if (brand.primaryColor) root.setProperty("--brand-primary", brand.primaryColor);
  if (brand.accentColor) root.setProperty("--brand-accent", brand.accentColor);
  if (brand.bg) root.setProperty("--brand-bg", brand.bg);
  if (brand.text) root.setProperty("--brand-text", brand.text);
}

const app = new App({ name: "TimeZest Scheduling Request Card", version: "1.0.0" });

/** Create an element with a class and (safe, text-node) children. */
function el(
  tag: string,
  className = "",
  ...children: Array<Node | string | null>
): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const child of children) {
    if (child == null) continue;
    node.append(child); // strings become text nodes — never parsed as HTML
  }
  return node;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function field(label: string, value: string | undefined, withDot = false): HTMLElement | null {
  if (!value) return null;
  const valueEl = el("div", withDot ? "field__value assigned" : "field__value");
  if (withDot) valueEl.append(el("span", "dot"));
  valueEl.append(value);
  return el("div", "field", el("div", "field__label", label), valueEl);
}

function badge(text: string | undefined, cls: string): HTMLElement | null {
  return text ? el("span", `badge ${cls}`, text) : null;
}

function render(r: SchedulingRequestCard): void {
  // Brand identity only renders when a brand was injected — the neutral
  // default shows just the request id/vendor context in the header.
  let brandId: HTMLElement | null = null;
  if (brandName || brand.logoUrl) {
    brandId = el("span", "brandid");
    if (brand.logoUrl) {
      const logo = document.createElement("img");
      logo.src = brand.logoUrl;
      logo.alt = brandName;
      logo.style.display = "inline-block";
      brandId.append(logo);
    }
    if (brandName) brandId.append(el("span", "brand", brandName));
  }

  let tickets: HTMLElement | null = null;
  if (r.psaTickets.length > 0) {
    tickets = el("div", "tickets");
    for (const t of r.psaTickets) tickets.append(el("span", "badge", t));
  }

  // The booking URL is pre-validated server-side as http(s)-only; render it
  // as a real link so the customer-facing page is one click away.
  let booking: HTMLElement | null = null;
  if (r.bookingUrl) {
    const link = document.createElement("a");
    link.href = r.bookingUrl;
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    link.append("Open booking page");
    booking = el("div", "booking", link);
  }

  let notes: HTMLElement | null = null;
  if (r.notes) {
    notes = el("div", "notes", el("div", "notes__h", "Notes"), el("div", "note", r.notes));
  }

  const body = el(
    "div",
    "card__body",
    el("div", "brandrow", brandId, el("span", "requestno", `Request ${r.id} · TimeZest`)),
    el("h1", "", r.title),
    el("div", "badges", badge(r.status, "badge--status"), badge(r.mode, "badge--mode")),
    el(
      "div",
      "grid",
      field("Customer", r.customer),
      field("Company", r.company),
      field("Email", r.email),
      field("Assigned to", r.assignedTo ?? "Unassigned", true),
      field("Window", r.window),
      field("Duration", r.duration),
      field("Scheduled", r.scheduledAt && fmtDate(r.scheduledAt)),
      field("Created", r.createdAt && fmtDate(r.createdAt)),
    ),
    tickets,
    booking,
    notes,
  );

  const root = document.getElementById("root")!;
  root.replaceChildren(el("div", "card", el("div", "card__bar"), body));
}

// timezest-mcp returns the scheduling-request JSON directly and attaches the
// normalized card to timezest_scheduling_get results as _card.
function extractCard(obj: unknown): SchedulingRequestCard | null {
  const card = (obj as { _card?: SchedulingRequestCard })?._card;
  return card && typeof card.id === "string" && typeof card.title === "string"
    ? { ...card, psaTickets: Array.isArray(card.psaTickets) ? card.psaTickets : [] }
    : null;
}

applyBrand();

// Must be set before connect() so the initial tool-result isn't missed.
app.ontoolresult = (result: { content?: Array<{ type: string; text?: string }> }) => {
  const payload = (result.content ?? []).find((c) => c.type === "text");
  if (!payload?.text) return;
  try {
    const card = extractCard(JSON.parse(payload.text));
    if (card) render(card);
  } catch {
    /* ignore malformed payloads */
  }
};

app.connect();
