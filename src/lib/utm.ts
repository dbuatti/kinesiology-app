// UTM / attribution capture.
//
// Captures utm_source, utm_medium, utm_campaign, utm_term, utm_content (and a
// few common click-id params) from the URL on first landing, persists them for
// the lifetime of the browser session + 30 days in localStorage, and exposes
// them so they can be attached to intake submissions and conversion events.
//
// No IDs / secrets are stored here — only attribution strings.

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landing_path?: string;
  captured_at?: string;
}

const STORAGE_KEY = "rk_utm";
const SESSION_KEY = "rk_utm_session";
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

function readStorage(key: string): UtmParams | null {
  try {
    const raw = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as UtmParams;
  } catch {
    return null;
  }
}

function writeStorage(params: UtmParams) {
  try {
    const serialized = JSON.stringify(params);
    window.sessionStorage.setItem(SESSION_KEY, serialized);
    // Persist across sessions for 30 days so a returning visitor still
    // attributes to the original campaign.
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

/** Capture from the current URL if any UTM/click-id params are present. */
export function captureUtmFromUrl(): UtmParams {
  if (typeof window === "undefined") return {};
  const url = new URL(window.location.href);
  const found: UtmParams = {};
  let hasAny = false;
  for (const p of PARAMS) {
    const v = url.searchParams.get(p);
    if (v) {
      (found as any)[p] = v;
      hasAny = true;
    }
  }
  // Always record referrer + landing path on first capture of a session.
  const existing = readStorage(SESSION_KEY);
  if (!existing) {
    found.referrer = document.referrer || undefined;
    found.landing_path = url.pathname + url.search;
    found.captured_at = new Date().toISOString();
  }

  if (hasAny || !existing) {
    // Merge with any previously captured values (don't clobber a campaign
    // param with an empty one on a later navigation).
    const merged: UtmParams = { ...(existing || {}), ...found };
    // Only persist if we actually captured something new OR nothing existed.
    if (hasAny || !existing) writeStorage(merged);
    return merged;
  }
  return existing || {};
}

/** Get the currently stored attribution (capturing from URL first). */
export function getUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  const captured = captureUtmFromUrl();
  return captured && Object.keys(captured).length > 0 ? captured : readStorage(STORAGE_KEY) || {};
}

/** Build a short human-readable source string for the referral_source field. */
export function utmToReferralSource(params: UtmParams): string | null {
  if (params.utm_source) {
    const parts = [params.utm_source];
    if (params.utm_medium) parts.push(params.utm_medium);
    if (params.utm_campaign) parts.push(params.utm_campaign);
    return parts.join(" / ");
  }
  if (params.gclid) return "Google Ads (gclid)";
  if (params.fbclid) return "Facebook (fbclid)";
  if (params.referrer) {
    try {
      const host = new URL(params.referrer).hostname;
      if (host && host !== window.location.hostname) return `Referral: ${host}`;
    } catch {
      /* ignore */
    }
  }
  return null;
}