
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
  Briefcase,
  Mic,
  Sun,
  MessageSquare,
  Compass,
  Heart,
  BookOpen,
  ShieldCheck,
  Trophy,
  GraduationCap,
  Zap,
  CalendarDays,
  BarChart3,
  DollarSign,
  Target,
} from "lucide-react";

export const CLINICAL_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Schedule", icon: Calendar, path: "/schedule" },
  { label: "Calendar", icon: CalendarDays, path: "/calendar" },
  { label: "Clients", icon: Users, path: "/clients" },
  { label: "Oversight", icon: TrendingUp, path: "/oversight" },
];

export const LAB_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Morning Program", icon: Sun, path: "/morning-program" },
  { label: "Journal", icon: MessageSquare, path: "/practice/journal" },
  { label: "The Lab", icon: Compass, path: "/lab" },
  { label: "Self Practice", icon: Heart, path: "/practice/self" },
];

export const LIBRARY_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Clinical Reference", icon: BookOpen, path: "/resources" },
  { label: "PEACE Framework", icon: ShieldCheck, path: "/peace-framework" },
  { label: "Procedures", icon: Trophy, path: "/practice/procedures" },
  { label: "Knowledge Quiz", icon: GraduationCap, path: "/practice/quiz" },
  { label: "Quick Calibrate", icon: Zap, path: "/practice/calibrate" },
];

export const VOICE_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/voice" },
  { label: "Voice Clients", icon: Users, path: "/voice/clients" },
  { label: "Book a Lesson", icon: Calendar, path: "/voice/book" },
  { label: "Studio Calendar", icon: TrendingUp, path: "/voice/calendar" },
];

export const BUSINESS_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/business/dashboard" },
  { label: "Overview", icon: BarChart3, path: "/business/overview" },
  { label: "Client Audit", icon: DollarSign, path: "/business/client-audit" },
  { label: "Marketing Engine", icon: Target, path: "/business/marketing-engine" },
];