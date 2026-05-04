"use client";

export interface PageAudit {
  path: string;
  title: string;
  category: 'Clinical' | 'Practice' | 'Business' | 'System' | 'Public';
  description: string;
  keyFeatures: string[];
}

export const SITE_MAP: PageAudit[] = [
  {
    path: "/",
    title: "Main Dashboard",
    category: "System",
    description: "The central hub of the application, providing a high-level overview of clinical operations, practice state, and knowledge access.",
    keyFeatures: ["Daily Briefing", "Practitioner Grounding Tool", "Live Session Tracking", "Quick Actions Grid"]
  },
  {
    path: "/clients",
    title: "Client Database",
    category: "Clinical",
    description: "A searchable repository of all client profiles and their high-level clinical stats.",
    keyFeatures: ["Search & Filter", "Table/Grid Views", "Quick Booking", "Stripe Sync Status"]
  },
  {
    path: "/clients/:id",
    title: "Client Detail Profile",
    category: "Clinical",
    description: "Comprehensive view of a single client's history, contact info, and clinical progress.",
    keyFeatures: ["Clinical Profile", "Session History", "BOLT/Coherence Trends", "Onboarding Management"]
  },
  {
    path: "/schedule",
    title: "Clinical Schedule",
    category: "Clinical",
    description: "Management of upcoming sessions and live availability via Cal.com integration.",
    keyFeatures: ["Session List", "Live Cal.com Slots", "Day Blocking (OOO)", "Rescheduling"]
  },
  {
    path: "/appointments/:id",
    title: "Session Workspace",
    category: "Clinical",
    description: "The primary interface for conducting a session, following the PEACE methodology.",
    keyFeatures: ["Session Timer", "PEACE Workflow Switcher", "Brainstem Tone Map", "Auto-saving Notes"]
  },
  {
    path: "/lab",
    title: "The Lab",
    category: "Practice",
    description: "A dedicated space for the practitioner's personal integration and identity work.",
    keyFeatures: ["Identity Map", "Worksheets Hub", "Fractal Analysis", "Backlog Management"]
  },
  {
    path: "/practice/journal",
    title: "Practitioner Journal",
    category: "Practice",
    description: "Private reflection space with AI-powered insight extraction for the Identity Sandbox.",
    keyFeatures: ["AI Insight Extraction", "Meetup Question Tracking", "Session Linking", "Deep Scan"]
  },
  {
    path: "/resources",
    title: "Clinical Bible",
    category: "Practice",
    description: "The definitive knowledge base for FNH protocols, anatomy, and TCM references.",
    keyFeatures: ["Meridian Clock", "Muscle Reference", "Brain Zone Map", "Video Library"]
  },
  {
    path: "/business",
    title: "Business Hub",
    category: "Business",
    description: "Strategic tools for practice growth and audience ownership.",
    keyFeatures: ["Marketing Engine", "Kit Integration", "AI Strategy Partners", "Leadership Portals"]
  },
  {
    path: "/onboarding/:id",
    title: "Public Onboarding Form",
    category: "Public",
    description: "The secure, client-facing intake form for gathering clinical history.",
    keyFeatures: ["Mobile Optimized", "Secure Encryption", "Stripe Payment Integration", "Auto-sync to CRM"]
  }
];