
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { setIpadMode } from "@/hooks/use-ipad-mode";
import { useAppMode } from "@/components/ModeProvider";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  Sun,
  MessageSquare,
  Heart,
  BookOpen,
  Brain,
  Activity,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Mic,
  Briefcase,
  Tablet,
  FileText,
  CalendarRange,
  Bot,
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
    label: "Clinical",
    items: [
      { label: "Home", icon: LayoutDashboard, path: "/" },
      { label: "Assistant", icon: Bot, path: "/assistant" },
      { label: "Calendar", icon: CalendarDays, path: "/calendar" },
      { label: "Timetable", icon: CalendarRange, path: "/timetable" },
      { label: "Clients", icon: Users, path: "/clients" },
      { label: "Sessions", icon: Activity, path: "/sessions" },
    ],
  },
  {
    label: "Practitioner Growth",
    items: [
      { label: "Morning Program", icon: Sun, path: "/morning-program" },
      { label: "Journal", icon: MessageSquare, path: "/journal" },
      { label: "Practice Hub", icon: Heart, path: "/practice" },
      { label: "Identity Work", icon: Brain, path: "/identity" },
    ],
  },
  {
    label: "Reference",
    items: [
      { label: "Worksheets", icon: FileText, path: "/worksheets" },
      { label: "Library", icon: BookOpen, path: "/library" },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Business", icon: Briefcase, path: "/business" },
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

interface SidebarProps {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

const Sidebar = ({ mobileOpen, onMobileOpenChange }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode } = useAppMode();
  const { isPrivate, togglePrivacy } = usePrivacyMode();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "Identity Work": false,
  });
  const setMobileOpen = onMobileOpenChange;
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('rk_sidebar_collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('rk_sidebar_collapsed', String(next));
  };

  // Single source of truth for the Voice/Kinesiology split — mode is
  // already kept in sync with the route by MainLayout, so this is exactly
  // equivalent to the old `location.pathname.startsWith('/voice')` check
  // without a second, disconnected copy of the same logic.
  const isVoice = mode === 'voice';
  const groups = isVoice
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
    <div className="flex flex-col h-full bg-card">
      {/* Logo */}
      <div className="shrink-0 px-4 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 no-underline" onClick={() => setMobileOpen(false)}>
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
      </div>

      {/* Context Switcher */}
      <div className="shrink-0 px-4 pt-3 pb-3 border-b border-border">
        <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Kinesiology" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all no-underline",
              !isVoice
                ? "bg-card text-foreground shadow-sm"
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
              "flex flex-1 items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all no-underline",
              isVoice
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Mic size={12} className="text-chart-destructive shrink-0" />
            <span className={cn("transition-opacity duration-200", collapsed && "hidden")}>Voice</span>
          </Link>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className={cn(
              "px-3 mb-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 transition-opacity duration-200",
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
                          "relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors",
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
                              aria-current={isActive(child.path) ? "page" : undefined}
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
                const active = isActive(item.path!);
                return (
                  <Link
                    key={item.path}
                    to={item.path!}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors",
                      collapsed ? "justify-center px-2" : "",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {active && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-primary" />
                    )}
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
            setMobileOpen(false);
            navigate('/practice/clinical-hub');
          }}
          title={collapsed ? "iPad Mode" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
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
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
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
            "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
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
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide text-chart-destructive hover:bg-destructive/10 transition-colors",
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
        "hidden lg:flex shrink-0 flex-col h-full border-r border-border transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile: content only — the trigger + header bar live in MainLayout
          (which owns mobileOpen/onMobileOpenChange) so the header can sit
          correctly in the content column's vertical stack rather than as a
          sibling of <aside> in this component's own horizontal position. */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="p-0 w-72 max-w-[85vw] border-r border-border">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
