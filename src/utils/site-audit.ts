
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
    path: "/appointments/:id/protocols",
    title: "Protocol Rail",
    category: "Clinical",
    description: "A focused, distraction-free interface for running specific neurological protocols during a session.",
    keyFeatures: ["Vertical Protocol Navigation", "Image Toggle", "Persistent Summary Area"]
  },
  {
    path: "/identity-map",
    title: "Identity Work",
    category: "Practice",
    description: "A dedicated space for the practitioner's personal integration and identity work.",
    keyFeatures: ["Identity Map", "Identity Shifting", "Fractal Analysis", "Backlog Management"]
  },
  {
    path: "/practice/journal",
    title: "Practitioner Journal",
    category: "Practice",
    description: "Private reflection space with AI-powered insight extraction.",
    keyFeatures: ["AI Insight Extraction", "Meetup Question Tracking", "Session Linking", "Deep Scan"]
  },
  {
    path: "/practice/quiz",
    title: "Knowledge Quiz",
    category: "Practice",
    description: "Infinite practice questions to sharpen clinical intuition across all FNH domains.",
    keyFeatures: ["AI-Generated Scenarios", "Streak Tracking", "Category Selection"]
  },
  {
    path: "/practice/procedures",
    title: "Mastery Tracker",
    category: "Practice",
    description: "Tracking proficiency and experience across all loggable clinical components.",
    keyFeatures: ["Mastery Levels", "Dysfunction Rate Analysis", "Weekly Focus Commitment"]
  },
  {
    path: "/resources",
    title: "Resources & Reference",
    category: "Practice",
    description: "The definitive knowledge base for FNH protocols, anatomy, and TCM references.",
    keyFeatures: ["Meridian Clock", "Muscle Reference", "Brain Zone Map", "Video Library"]
  },
  {
    path: "/resources/print",
    title: "Print Hub",
    category: "Practice",
    description: "Central repository for all landscape-optimized reference sheets and worksheets.",
    keyFeatures: ["A4 Landscape Optimization", "Reference Sheets", "Assessment Logs"]
  },
  {
    path: "/peace-framework",
    title: "PEACE Framework",
    category: "Practice",
    description: "Mastery guide for the central clinical hierarchy of Functional Neuro Health.",
    keyFeatures: ["5-Step Methodology", "Clinical Tiers", "Mastery Principles"]
  },
  {
    path: "/morning-program",
    title: "Morning Program",
    category: "Practice",
    description: "Daily ritual for establishing the practitioner's clinical state.",
    keyFeatures: ["Grounding Tool", "Readiness Checklist", "HeartMath Breathing"]
  },
  {
    path: "/business",
    title: "Business",
    category: "Business",
    description: "Strategic tools for practice growth and audience ownership.",
    keyFeatures: ["Marketing Engine", "Client Audit", "AI Strategy Partners", "Leadership Portals"]
  },
  {
    path: "/business/marketing-engine",
    title: "Marketing Engine",
    category: "Business",
    description: "Transforming clinical wins into distribution-ready assets for Kit.",
    keyFeatures: ["Wins Vault", "AI Prompt Studio", "HTML Template Studio"]
  },
  {
    path: "/onboarding/:id",
    title: "Public Onboarding Form",
    category: "Public",
    description: "The secure, client-facing intake form for gathering clinical history.",
    keyFeatures: ["Mobile Optimized", "Secure Encryption", "Stripe Payment Integration", "Auto-sync to CRM"]
  }
];