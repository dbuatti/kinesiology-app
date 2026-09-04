/**
 * Central configuration for external integrations.
 * Update these IDs when your Cal.com or Notion setup changes.
 */

export const CALCOM_CONFIG = {
  // The default event type for Kinesiology sessions
  DEFAULT_EVENT_TYPE_ID: "4279898",
  // Your primary availability schedule
  DEFAULT_SCHEDULE_ID: "1387833",
  // The public booking URL
  BOOKING_URL: "https://cal.com/danielebuatti/fnh-neuro",
  COMMUNITY_FREE_URL: "https://cal.com/danielebuatti/fnh-neuro-health-assessment-community-free",
  
  // Voice Studio coaching URLs
  VOICE_COACHING_URL: "https://cal.com/danielebuatti/voice-and-piano-coaching-60",
  VOICE_COACHING_45_URL: "https://cal.com/danielebuatti/voice-and-piano-coaching-45",
  VOICE_COACHING_30_URL: "https://cal.com/danielebuatti/voice-and-piano-coaching-30-minutes",

  // Voice Studio event type IDs
  VOICE_EVENT_TYPE_60: "1945081",
  VOICE_EVENT_TYPE_45: "5925021",
  VOICE_EVENT_TYPE_30: "6488157",
  VOICE_EVENT_TYPE_IDS: [1945081, 5925021, 6488157] as const,
  
  // Only these IDs will be processed by the CRM webhooks and sync functions
  CLINICAL_EVENT_IDS: [4279898, 5302336, 5927215],

  EVENT_TYPES: [
    {
      id: "4279898",
      name: "Standard Session",
      price: 70,
      currency: "AUD",
      description: "75-minute neurological kinesiology session"
    },
    {
      id: "5302336",
      name: "Full Price Session",
      price: 100,
      currency: "AUD",
      description: "Full price neurological kinesiology session"
    },
    {
      id: "5927215",
      name: "Community Free Session",
      price: 0,
      currency: "AUD",
      description: "Free weekly community FNH session"
    }
  ]
};

/**
 * The bookable services the auto-drafter can pencil in, grouped by kind. The
 * `id` is the Cal.com event type booked at confirm time; `durationMin` drives
 * the default choice for a client when they haven't been assigned one.
 */
export interface DraftService {
  id: string;
  kind: "fnh" | "voice";
  label: string;
  durationMin: number;
  price: number;
}

export const DRAFT_SERVICES: DraftService[] = [
  { id: "5302336", kind: "fnh", label: "FNH · client rate", durationMin: 60, price: 100 },
  { id: "4279898", kind: "fnh", label: "FNH · new client $70", durationMin: 60, price: 70 },
  { id: "5927215", kind: "fnh", label: "FNH · community (free)", durationMin: 60, price: 0 },
  { id: "1945081", kind: "voice", label: "Voice · 60 min", durationMin: 60, price: 95 },
  { id: "5925021", kind: "voice", label: "Voice · 45 min", durationMin: 45, price: 75 },
  { id: "6488157", kind: "voice", label: "Voice · 30 min", durationMin: 30, price: 50 },
];

export function serviceFor(id: string | null | undefined): DraftService | null {
  if (!id) return null;
  return DRAFT_SERVICES.find((s) => s.id === id) ?? null;
}

/**
 * Best default event type for a client with no explicit service chosen:
 * voice → matched to their session length; fnh → the client rate.
 */
export function defaultServiceId(kind: "fnh" | "voice", sessionLengthMin?: number | null): string {
  if (kind === "voice") {
    if (sessionLengthMin === 30) return "6488157";
    if (sessionLengthMin === 45) return "5925021";
    return "1945081"; // default voice = 60
  }
  return "5302336"; // default fnh = existing client rate
}

export function serviceLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return DRAFT_SERVICES.find((s) => s.id === id)?.label ?? null;
}

export const TIMEZONE = "Australia/Melbourne";

export const NOTION_CONFIG = {
  MAIN_DB_ID: "171f7156cdc645e8b689af13d217bc7c",
  PLANNER_DB_ID: "11caad21cd0980d8a3eeeffb27fc43c0",

  // Voice Studio databases
  VOICE_CLIENTS_DB_ID: "af3e38f400d84dc8975eff4b6269157b",
  VOICE_LESSONS_DB_1_ID: "8d6369c637c8425fb007adf261f8e576",
  VOICE_LESSONS_DB_2_ID: "11caad21cd0980d8a3eeeffb27fc43c0"
};