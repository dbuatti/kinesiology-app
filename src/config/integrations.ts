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
  BOOKING_URL: "https://cal.com/danielebuatti/fnh-neuro-75",
  
  // Only these IDs will be processed by the CRM webhooks and sync functions
  CLINICAL_EVENT_IDS: [4279898, 5302336],

  EVENT_TYPES: [
    {
      id: "4279898",
      name: "Standard Session",
      price: 50,
      currency: "AUD",
      description: "75-minute neurological kinesiology session"
    },
    {
      id: "5302336",
      name: "Full Price Session",
      price: 100,
      currency: "AUD",
      description: "Full price neurological kinesiology session"
    }
  ]
};

export const NOTION_CONFIG = {
  MAIN_DB_ID: "171f7156cdc645e8b689af13d217bc7c",
  PLANNER_DB_ID: "11caad21cd0980d8a3eeeffb27fc43c0"
};