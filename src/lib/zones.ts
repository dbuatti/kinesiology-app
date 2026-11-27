// The app's three zones — kinds of work, not practices. Kinesiology, voice and
// piano are one practice to the practitioner, so every zone shows all of
// them; the zone decides what you're *doing*:
//
//   Practice  — seeing clients and teaching (today, calendar, sessions, people)
//   Business  — admin and client relationships (inbox, follow-up, money, audit)
//   Growth    — the practitioner's own development and reference material
//
// Single source of truth for the sidebar, the phone tab bar, the route→zone
// sync in MainLayout, breadcrumbs, and ⌘K zone switching. Edit here, not in
// those components.
//
// Navigation rule: at most FIVE primary destinations per zone. Everything
// else lives in `more`, which the sidebar keeps behind a disclosure and the
// phone's "More" drawer already exposes. No destination appears in two zones.
import {
  LayoutDashboard,
  CalendarDays,
  Activity,
  Users,
  Mail,
  UserRoundCheck,
  Bot,
  Wallet,
  ClipboardList,
  CalendarRange,
  Megaphone,
  Sunrise,
  MessageSquare,
  Heart,
  Brain,
  BookOpen,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type Zone = "practice" | "business" | "growth";

export interface NavItem { label: string; icon: LucideIcon; path: string }
export interface NavGroup { label: string; items: NavItem[] }

export interface ZoneDef {
  id: Zone;
  label: string;
  home: string;
  dot: string; // tailwind bg class for the switcher dot
  aura: [string, string]; // two radial tints for the page aura
  groups: NavGroup[]; // primary destinations — keep the total at five or fewer
  more?: NavItem[]; // secondary destinations, behind the "More" disclosure
  tabs: NavItem[]; // phone/tablet bottom bar (4 max, "More" is added)
}

const TODAY: NavItem = { label: "Today", icon: LayoutDashboard, path: "/" };
const CALENDAR: NavItem = { label: "Calendar", icon: CalendarDays, path: "/calendar" };
const PEOPLE: NavItem = { label: "People", icon: Users, path: "/clients" };
const SESSIONS: NavItem = { label: "Sessions", icon: Activity, path: "/sessions" };
const INBOX: NavItem = { label: "Inbox", icon: Mail, path: "/inbox" };
const FOLLOW_UP: NavItem = { label: "Follow-up", icon: UserRoundCheck, path: "/follow-up" };
const ASSISTANT: NavItem = { label: "Assistant", icon: Bot, path: "/assistant" };
const MONEY: NavItem = { label: "Money", icon: Wallet, path: "/money" };
const AUDIT: NavItem = { label: "Rates & audit", icon: ClipboardList, path: "/audit" };
const TIMETABLE: NavItem = { label: "Availability", icon: CalendarRange, path: "/timetable" };
const MARKETING: NavItem = { label: "Marketing", icon: Megaphone, path: "/marketing" };
const MORNING: NavItem = { label: "Morning Program", icon: Sunrise, path: "/morning-program" };
const JOURNAL: NavItem = { label: "Journal", icon: MessageSquare, path: "/journal" };
const PRACTICE_HUB: NavItem = { label: "Practice Hub", icon: Heart, path: "/practice" };
const IDENTITY: NavItem = { label: "Identity Work", icon: Brain, path: "/identity" };
const LIBRARY: NavItem = { label: "Library", icon: BookOpen, path: "/library" };
const WORKSHEETS: NavItem = { label: "Worksheets", icon: FileText, path: "/worksheets" };
const LIMITING_BELIEFS: NavItem = { label: "Limiting Beliefs", icon: Brain, path: "/identity?tool=limiting" };

export const ZONES: Record<Zone, ZoneDef> = {
  practice: {
    id: "practice",
    label: "Practice",
    home: "/",
    dot: "bg-chart-primary",
    aura: ["hsl(236 80% 62% / 0.11)", "hsl(266 70% 60% / 0.07)"],
    // Four clinical destinations. Corrections live under "More" — it is a
    // reference tool, not somewhere you start the day.
    groups: [
      { label: "Practice", items: [TODAY, CALENDAR, SESSIONS, PEOPLE] },
    ],
    more: [LIMITING_BELIEFS],
    tabs: [TODAY, CALENDAR, SESSIONS, PEOPLE],
  },
  business: {
    id: "business",
    label: "Business",
    home: "/inbox",
    dot: "bg-chart-primary",
    aura: ["hsl(255 70% 58% / 0.10)", "hsl(275 60% 58% / 0.06)"],
    // Five destinations: the work that keeps the practice running.
    groups: [
      { label: "Business", items: [INBOX, FOLLOW_UP, ASSISTANT, MONEY, AUDIT] },
    ],
    more: [TIMETABLE, MARKETING],
    tabs: [INBOX, FOLLOW_UP, MONEY, ASSISTANT],
  },
  growth: {
    id: "growth",
    label: "Growth",
    home: "/morning-program",
    dot: "bg-chart-amber",
    aura: ["hsl(38 92% 55% / 0.10)", "hsl(18 90% 60% / 0.06)"],
    // Five destinations: your own practice and reference material.
    groups: [
      { label: "Growth", items: [MORNING, JOURNAL, PRACTICE_HUB, IDENTITY, LIBRARY] },
    ],
    more: [WORKSHEETS, LIMITING_BELIEFS],
    tabs: [MORNING, JOURNAL, PRACTICE_HUB, LIBRARY],
  },
};

export const ZONE_ORDER: Zone[] = ["practice", "business", "growth"];

/** Older builds stored "clinical" / "voice"; both are the Practice zone now. */
export function normaliseZone(value: string | null | undefined): Zone {
  if (value === "business" || value === "growth") return value;
  return "practice";
}

const startsWithAny = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));

// Reachable from more than one zone (they appear in several navs, or are
// system pages): visiting them keeps whichever zone you were in, so the
// sidebar never flips out from under you mid-task.
const SHARED = ["/assistant", "/clients", "/calendar", "/settings", "/availability"];
const BUSINESS = ["/inbox", "/follow-up", "/money", "/audit", "/marketing", "/business", "/timetable"];
const GROWTH = ["/morning-program", "/journal", "/identity", "/library", "/worksheets", "/resources", "/peace-framework", "/lab", "/limiting-beliefs"];

/** The zone a URL belongs to, or null when it's shared and the zone should stay as it is. */
export function zoneForPath(pathname: string): Zone | null {
  if (startsWithAny(pathname, SHARED)) return null;
  if (startsWithAny(pathname, BUSINESS)) return "business";
  // Practice Hub is Growth; the sessions bridge and sandbox under /practice are clinical tools.
  if (startsWithAny(pathname, ["/practice/clinical-hub", "/practice/trial"])) return "practice";
  if (startsWithAny(pathname, GROWTH) || startsWithAny(pathname, ["/practice"])) return "growth";
  return "practice";
}

/** Most specific nav item matching the path, so /clients/x lights up People and not Today. */
export function activeNavPath(paths: string[], pathname: string): string | undefined {
  return paths
    .filter((p) => pathname === p || (p !== "/" && pathname.startsWith(p + "/")))
    .sort((a, b) => b.length - a.length)[0];
}

/** Every destination in a zone, primary and secondary — used by search. */
export function zoneItems(zone: ZoneDef): NavItem[] {
  return [...zone.groups.flatMap((g) => g.items), ...(zone.more ?? [])];
}

// Breadcrumb: first URL segment → [page title, section label, section link].
export const BREADCRUMBS: Record<string, [string, string, string]> = {
  "": ["Today", "Practice", "/"],
  calendar: ["Calendar", "Practice", "/"],
  sessions: ["Sessions", "Practice", "/"],
  appointments: ["Session", "Sessions", "/sessions"],
  clients: ["People", "Practice", "/"],
  voice: ["Students", "People", "/clients"],
  availability: ["Availability", "Calendar", "/calendar"],
  inbox: ["Inbox", "Business", "/inbox"],
  "follow-up": ["Follow-up", "Business", "/inbox"],
  assistant: ["Assistant", "Business", "/inbox"],
  money: ["Money", "Business", "/inbox"],
  audit: ["Rates & audit", "Business", "/inbox"],
  marketing: ["Marketing", "Business", "/inbox"],
  business: ["Money", "Business", "/inbox"],
  timetable: ["Availability", "Business", "/inbox"],
  "morning-program": ["Morning Program", "Growth", "/morning-program"],
  journal: ["Journal", "Growth", "/morning-program"],
  practice: ["Practice Hub", "Growth", "/morning-program"],
  identity: ["Identity Work", "Growth", "/morning-program"],
  library: ["Library", "Growth", "/morning-program"],
  worksheets: ["Worksheets", "Growth", "/morning-program"],
  resources: ["Resources", "Library", "/library"],
  "peace-framework": ["PEACE Framework", "Library", "/library"],
  limiting: ["Limiting Beliefs", "Growth", "/morning-program"],
  settings: ["Settings", "System", "/settings"],
};