
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { setIpadMode } from "@/hooks/use-ipad-mode";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
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
  CalendarCheck,
  BarChart3,
  DollarSign,
  Target,
  Brain,
  FileText,
  Activity,
  HelpCircle,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  LayoutGrid,
  Fingerprint,
  ShieldAlert,
  Layers,
  Mic,
  Briefcase,
  Tablet,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: any;
  path?: string;
  children?: { label: string; path: string; icon?: any }[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Clinic",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
      { label: "Calendar", icon: CalendarDays, path: "/calendar" },
      { label: "Appointments", icon: CalendarCheck, path: "/appointments" },
      { label: "Availability", icon: Calendar, path: "/availability" },
      { label: "Clients", icon: Users, path: "/clients" },
      { label: "Oversight", icon: TrendingUp, path: "/oversight" },
    ],
  },
  {
    label: "Practitioner",
    items: [
      { label: "Morning Program", icon: Sun, path: "/morning-program" },
      { label: "Journal", icon: MessageSquare, path: "/practice/journal" },
      {
        label: "Identity Work",
        icon: Brain,
        children: [
          { label: "Identity Map", path: "/identity-map", icon: Compass },
          { label: "Identity Shifting", path: "/identity-shifting", icon: Fingerprint },
          { label: "Identity Alignment", path: "/identity-alignment", icon: Target },
          { label: "Limiting Beliefs", path: "/limiting-beliefs", icon: ShieldAlert },
          { label: "Fractal Analysis", path: "/fractals", icon: Layers },
        ],
      },
      {
        label: "Worksheets",
        icon: FileText,
        children: [
          { label: "Where Your Value Begins", path: "/resources/worksheets/where-your-value-begins", icon: Lightbulb },
          { label: "Fear & Creativity", path: "/resources/worksheets/fear-creativity", icon: Zap },
          { label: "Setting Your North Star", path: "/resources/worksheets/north-star", icon: Target },
          { label: "Inner Awareness", path: "/resources/worksheets/inner-awareness", icon: Brain },
          { label: "Anger & Flow", path: "/resources/worksheets/anger-flow", icon: Activity },
          { label: "Business Model Canvas", path: "/resources/worksheets/business-model", icon: LayoutGrid },
        ],
      },
      { label: "Self Practice", icon: Heart, path: "/practice/self" },
    ],
  },
  {
    label: "Reference",
    items: [
      { label: "Resources & Reference", icon: BookOpen, path: "/resources" },
      { label: "PEACE Framework", icon: ShieldCheck, path: "/peace-framework" },
      { label: "Procedures", icon: Trophy, path: "/practice/procedures" },
      { label: "Knowledge Quiz", icon: GraduationCap, path: "/practice/quiz" },
      { label: "Quick Calibrate", icon: Zap, path: "/practice/calibrate" },
      { label: "Corrections", icon: Target, path: "/practice/corrections" },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/business/dashboard" },
      { label: "Overview", icon: BarChart3, path: "/business/overview" },
      { label: "Client Audit", icon: DollarSign, path: "/business/client-audit" },
      { label: "Marketing Engine", icon: Target, path: "/business/marketing-engine" },
      { label: "Follow-Up", icon: Activity, path: "/business/follow-up" },
    ],
  },
  {
    label: "Voice Studio",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/voice" },
      { label: "Clients", icon: Users, path: "/voice/clients" },
      { label: "Calendar", icon: CalendarDays, path: "/calendar" },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPrivate, togglePrivacy } = usePrivacyMode();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "Identity Work": false,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('rk_sidebar_collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('rk_sidebar_collapsed', String(next));
  };

  const isVoiceRoute = location.pathname.startsWith('/voice');
  const groups = isVoiceRoute
    ? NAV_GROUPS.filter((g) => g.label === "Voice Studio")
    : NAV_GROUPS;

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

  const isAnyChildActive = (children: { path: string }[]) =>
    children.some((c) => isActive(c.path));

  const toggleExpand = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <div className="shrink-0 px-4 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              K
            </span>
            <span className={cn(
              "text-xs font-bold uppercase tracking-wider text-foreground transition-opacity duration-200",
              collapsed && "hidden"
            )}>
              Kinesiology
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="hidden lg:flex p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft size={18} className={cn(
              "transition-transform duration-200",
              collapsed && "rotate-180"
            )} />
          </button>
          <button
            className="lg:hidden p-1 rounded-lg hover:bg-muted"
            onClick={() => setMobileOpen(false)}
          >
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Context Switcher */}
      <div className="shrink-0 px-4 pt-2 pb-3 border-b border-border">
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Kinesiology" : undefined}
            className={cn(
              "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all no-underline",
              collapsed ? "flex-1" : "flex-1",
              !location.pathname.startsWith('/voice')
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Activity size={12} className="text-chart-primary shrink-0" />
            <span className={cn("transition-opacity duration-200", collapsed && "hidden")}>Kinesiology</span>
          </Link>
          <Link
            to="/voice"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Voice" : undefined}
            className={cn(
              "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all no-underline",
              collapsed ? "flex-1" : "flex-1",
              location.pathname.startsWith('/voice')
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Mic size={12} className="text-chart-destructive shrink-0" />
            <span className={cn("transition-opacity duration-200", collapsed && "hidden")}>Voice</span>
          </Link>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className={cn(
              "px-3 mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 transition-opacity duration-200",
              collapsed && "sr-only"
            )}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                if (item.children) {
                  const childActive = isAnyChildActive(item.children);
                  const isExpanded = expanded[item.label] ?? childActive;
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleExpand(item.label)}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors",
                          collapsed ? "justify-center px-2" : "",
                          childActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon size={16} className="shrink-0" />
                        <span className={cn("flex-1 text-left transition-opacity duration-200", collapsed && "hidden")}>{item.label}</span>
                        {!collapsed && (isExpanded ? (
                          <ChevronDown size={14} className="opacity-50 shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="opacity-50 shrink-0" />
                        ))}
                      </button>
                      {!collapsed && isExpanded && (
                        <div className="ml-5 mt-0.5 space-y-0.5 border-l-2 border-border pl-3">
                          {item.children.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                                isActive(child.path)
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              )}
                            >
                              {child.icon && <child.icon size={14} />}
                              <span>{child.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.path}
                    to={item.path!}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors",
                      collapsed ? "justify-center px-2" : "",
                      isActive(item.path!)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon size={16} className="shrink-0" />
                    <span className={cn("transition-opacity duration-200", collapsed && "hidden")}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="shrink-0 border-t border-border py-3 px-3 space-y-0.5">
        <button
          onClick={() => {
            setIpadMode(true);
            navigate('/practice/clinical-hub');
          }}
          title={collapsed ? "iPad Mode" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <Tablet size={16} className="text-chart-emerald shrink-0" />
          <span className={cn("transition-opacity duration-200", collapsed && "hidden")}>iPad Mode</span>
        </button>
        <button
          onClick={togglePrivacy}
          title={collapsed ? (isPrivate ? "Disable Privacy" : "Enable Privacy") : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          {isPrivate ? (
            <EyeOff size={16} className="text-chart-destructive shrink-0" />
          ) : (
            <Eye size={16} className="shrink-0" />
          )}
          <span className={cn("transition-opacity duration-200", collapsed && "hidden")}>{isPrivate ? "Disable Privacy" : "Enable Privacy"}</span>
        </button>
        <Link
          to="/settings"
          onClick={() => setMobileOpen(false)}
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings size={16} className="shrink-0" />
          <span className={cn("transition-opacity duration-200", collapsed && "hidden")}>Settings</span>
        </Link>
        <button
          onClick={async () => {
            const { supabase } = await import("@/integrations/supabase/client");
            const { showSuccess } = await import("@/utils/toast");
            await supabase.auth.signOut();
            showSuccess("Signed out successfully");
            window.location.href = "/login";
          }}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-chart-destructive hover:bg-destructive/10 transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut size={16} className="shrink-0" />
          <span className={cn("transition-opacity duration-200", collapsed && "hidden")}>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex shrink-0 flex-col h-full transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 left-6 z-40 lg:hidden w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <LayoutDashboard size={20} />
      </button>
    </>
  );
};

export default Sidebar;
