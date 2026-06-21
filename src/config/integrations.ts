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

export const NOTION_CONFIG = {
  MAIN_DB_ID: "171f7156cdc645e8b689af13d217bc7c",
  PLANNER_DB_ID: "11caad21cd0980d8a3eeeffb27fc43c0",

  // Voice Studio databases
  VOICE_CLIENTS_DB_ID: "af3e38f400d84dc8975eff4b6269157b",
  VOICE_LESSONS_DB_1_ID: "8d6369c637c8425fb007adf261f8e576",
  VOICE_LESSONS_DB_2_ID: "11caad21cd0980d8a3eeeffb27fc43c0"
};