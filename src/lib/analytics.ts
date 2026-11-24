// Lightweight analytics + conversion tracking layer.
//
// Reads configuration from Vite env vars (see .env.example):
//   VITE_GA_MEASUREMENT_ID        e.g. G-XXXXXXXXXX
//   VITE_GOOGLE_ADS_CONVERSION_ID e.g. AW-XXXXXXXXX/YYYYYYYY
//
// Everything is a no-op when the IDs are absent, so local dev and
// unconfigured deployments keep working. gtag is injected lazily on first use.

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

const GA_ID = ((import.meta as any).env?.VITE_GA_MEASUREMENT_ID || (import.meta as any).env?.VITE_GA4_MEASUREMENT_ID) as string | undefined;
const ADS_CONVERSION_ID = (import.meta as any).env?.VITE_GOOGLE_ADS_CONVERSION_ID as string | undefined;

let initialised = false;

function ensureGtag() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  if (!GA_ID && !ADS_CONVERSION_ID) return; // nothing to do

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID || ADS_CONVERSION_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  if (GA_ID) window.gtag("config", GA_ID, { send_page_view: false });
  if (ADS_CONVERSION_ID) {
    // Configure the ads account for conversion tracking.
    const acct = ADS_CONVERSION_ID.split("/")[0];
    window.gtag("config", acct);
  }
}

export function trackPageView(path?: string) {
  ensureGtag();
  if (!window.gtag) return;
  if (GA_ID) {
    window.gtag("event", "page_view", {
      page_path: path || window.location.pathname + window.location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }
}

export function trackEvent(name: string, params: Record<string, any> = {}) {
  ensureGtag();
  if (!window.gtag) return;
  window.gtag("event", name, params);
}

/** Fire a Google Ads conversion. Safe no-op if not configured. */
export function trackConversion(label?: string, value?: number, currency = "AUD") {
  ensureGtag();
  if (!window.gtag || !ADS_CONVERSION_ID) return;
  window.gtag("event", "conversion", {
    send_to: label || ADS_CONVERSION_ID,
    value,
    currency,
  });
}

export const analyticsConfigured = Boolean(GA_ID || ADS_CONVERSION_ID);