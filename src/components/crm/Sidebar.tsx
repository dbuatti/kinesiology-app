import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, LayoutGroup } from "framer-motion";
import { useTheme } from "next-themes";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { setIpadMode } from "@/hooks/use-ipad-mode";
import { useAppMode } from "@/components/ModeProvider";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  Sun,
  Moon,
  Monitor,
  MessageSquare,
  Heart,
  BookOpen,
  Brain,
  Activity,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  CalendarDays,
  Briefcase,
  Tablet,
  FileText,
  CalendarRange,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsUpDown,
  Sunrise,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
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
      { label: "Morning Program", icon: Sunrise, path: "/morning-program" },
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
      { label: "Assistant", icon: Bot, path: "/assistant" },
      { label: "Clients", icon: Users, path: "/clients" },
      { label: "Business Hub", icon: Briefcase, path: "/business" },
    ],
  },
  {
    label: "Voice Studio",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/voice" },
      { label: "Students", icon: Users, path: "/voice/clients" },
      { label: "Calendar", icon: CalendarDays, path: "/calendar" },
    ],
  },
];

const WORKSPACES = [
  { id: "clinical", label: "Clinical", to: "/", dot: "bg-chart-primary" },
  { id: "voice", label: "Voice", to: "/voice", dot: "bg-chart-destructive" },
  { id: "business", label: "Business", to: "/business", dot: "bg-chart-emerald" },
] as const;

const COLLAPSE_KEY = "rk_sidebar_collapsed";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  drawerOnly?: boolean;
}

/** Wraps a control in a right-side tooltip only when the rail is collapsed. */
const RailTip = ({ show, label, children }: { show: boolean; label: string; children: React.ReactElement }) =>
  show ? (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="text-xs font-medium">
        {label}
      </TooltipContent>
    </Tooltip>
  ) : (
    children
  );

const Sidebar = ({ mobileOpen, onMobileOpenChange, drawerOnly = false }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode } = useAppMode();
  const { session } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isPrivate, togglePrivacy } = usePrivacyMode();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "true");

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  // ⌘\ / Ctrl+\ collapses the rail — same muscle memory as most pro apps.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Mode is kept in sync with the route by MainLayout. Business and Voice
  // show only their own nav, deliberately not blended with Clinical's.
  const isVoice = mode === "voice";
  const isBusiness = mode === "business";
  const activeWorkspace = isVoice ? "voice" : isBusiness ? "business" : "clinical";
  const groups = isVoice
    ? NAV_GROUPS.filter((g) => g.label === "Voice Studio")
    : isBusiness
    ? NAV_GROUPS.filter((g) => g.label === "Business")
    : NAV_GROUPS.filter((g) => g.label !== "Business" && g.label !== "Voice Studio");

  // Most specific match wins, so "/voice/clients" doesn't also light up "/voice".
  const allPaths = groups.flatMap((g) => g.items.map((i) => i.path));
  const matches = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path + "/"));
  const activePath = allPaths.filter(matches).sort((a, b) => b.length - a.length)[0];

  const email = session?.user?.email ?? "";
  const displayName =
    (session?.user?.user_metadata?.full_name as string | undefined) || "Daniele Buatti";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const close = () => onMobileOpenChange(false);

  const signOut = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { showSuccess } = await import("@/utils/toast");
    await supabase.auth.signOut();
    showSuccess("Signed out");
    window.location.href = "/login";
  };

  const renderContent = (isRail: boolean, scope: string) => (
    <div className="flex h-full flex-col bg-sidebar text-[13px]">
      {/* Brand */}
      <div className={cn("flex h-14 shrink-0 items-center gap-2.5", isRail ? "justify-center px-0" : "pl-4 pr-3")}>
        <Link to="/" onClick={close} className="group flex min-w-0 items-center gap-2.5" aria-label="Resonance — home">
          <BrandMark className="h-7 w-7 shrink-0 transition-transform duration-300 ease-out-expo group-hover:scale-[1.04]" />
          {!isRail && (
            <div className="min-w-0 leading-none">
              <div className="truncate text-[14px] font-semibold tracking-[-0.015em] text-foreground">Resonance</div>
              <div className="mt-1 truncate text-[11px] text-muted-foreground">Practice studio</div>
            </div>
          )}
        </Link>
        {!isRail && !drawerOnly && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleCollapsed}
                className="ml-auto hidden h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground lg:flex"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={16} strokeWidth={1.75} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Collapse <span className="ml-1.5 opacity-60">⌘\</span>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Workspace switcher */}
      <div className={cn("shrink-0 pb-2", isRail ? "px-2" : "px-3")}>
        {isRail ? (
          <div className="flex flex-col items-center gap-1">
            {WORKSPACES.map((w) => (
              <RailTip key={w.id} show label={w.label}>
                <Link
                  to={w.to}
                  onClick={close}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md",
                    activeWorkspace === w.id ? "bg-sidebar-active shadow-sm ring-1 ring-border/70" : "hover:bg-foreground/[0.05]"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", w.dot, activeWorkspace !== w.id && "opacity-50")} />
                </Link>
              </RailTip>
            ))}
          </div>
        ) : (
          <LayoutGroup id={`ws-${scope}`}>
            <div className="relative grid grid-cols-3 rounded-[9px] bg-foreground/[0.045] p-[3px] dark:bg-muted/50">
              {WORKSPACES.map((w) => {
                const on = activeWorkspace === w.id;
                return (
                  <Link
                    key={w.id}
                    to={w.to}
                    onClick={close}
                    className={cn(
                      "relative z-10 flex h-7 min-w-0 items-center justify-center gap-1.5 rounded-[7px] text-[12px] font-medium",
                      on ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {on && (
                      <motion.span
                        layoutId={`ws-pill-${scope}`}
                        className="absolute inset-0 -z-10 rounded-[7px] bg-sidebar-active shadow-sm ring-1 ring-border/70"
                        transition={{ type: "spring", stiffness: 520, damping: 40 }}
                      />
                    )}
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", w.dot, !on && "opacity-60")} />
                    <span className="truncate">{w.label}</span>
                  </Link>
                );
              })}
            </div>
          </LayoutGroup>
        )}
      </div>

      {/* Navigation */}
      <LayoutGroup id={`nav-${scope}`}>
        <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden pb-4 pt-2", isRail ? "px-2" : "px-3")}>
          {groups.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && "mt-5")}>
              {isRail ? (
                gi > 0 && <div className="mx-auto mb-3 h-px w-5 bg-border" />
              ) : (
                <div className="mb-1 px-2.5 text-[11px] font-medium text-muted-foreground/80">{group.label}</div>
              )}
              <div className="space-y-px">
                {group.items.map((item) => {
                  const active = item.path === activePath;
                  return (
                    <RailTip key={item.path + item.label} show={isRail} label={item.label}>
                      <Link
                        to={item.path}
                        onClick={close}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex h-8 items-center gap-2.5 rounded-[7px] font-medium outline-none",
                          isRail ? "justify-center px-0" : "px-2.5",
                          active ? "text-foreground" : "text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground"
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId={`nav-pill-${scope}`}
                            className="absolute inset-0 rounded-[7px] bg-sidebar-active shadow-sm ring-1 ring-border/70"
                            transition={{ type: "spring", stiffness: 520, damping: 42 }}
                          />
                        )}
                        <item.icon
                          size={16}
                          strokeWidth={active ? 2 : 1.75}
                          className={cn("relative shrink-0", active ? "text-primary" : "text-muted-foreground/90 group-hover:text-foreground")}
                        />
                        {!isRail && <span className="relative truncate">{item.label}</span>}
                      </Link>
                    </RailTip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </LayoutGroup>

      {/* Footer */}
      <div className={cn("shrink-0 space-y-px border-t border-sidebar-border py-2", isRail ? "px-2" : "px-3")}>
        <RailTip show={isRail} label={isPrivate ? "Privacy on" : "Privacy off"}>
          <button
            onClick={togglePrivacy}
            className={cn(
              "flex h-8 w-full items-center gap-2.5 rounded-[7px] font-medium",
              isRail ? "justify-center" : "px-2.5",
              isPrivate ? "text-chart-destructive" : "text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground"
            )}
          >
            {isPrivate ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
            {!isRail && (
              <>
                <span>Privacy mode</span>
                <span
                  className={cn(
                    "ml-auto flex h-4 w-7 items-center rounded-full p-0.5 transition-colors duration-200",
                    isPrivate ? "bg-chart-destructive" : "bg-foreground/15"
                  )}
                >
                  <span className={cn("h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out-expo", isPrivate && "translate-x-3")} />
                </span>
              </>
            )}
          </button>
        </RailTip>
        <RailTip show={isRail} label="Settings">
          <Link
            to="/settings"
            onClick={close}
            className={cn(
              "flex h-8 items-center gap-2.5 rounded-[7px] font-medium",
              isRail ? "justify-center" : "px-2.5",
              location.pathname.startsWith("/settings")
                ? "bg-sidebar-active text-foreground shadow-sm ring-1 ring-border/70"
                : "text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground"
            )}
          >
            <Settings size={16} strokeWidth={1.75} />
            {!isRail && <span>Settings</span>}
          </Link>
        </RailTip>

        {/* Account */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "mt-1 flex w-full items-center gap-2.5 rounded-[9px] py-1.5 text-left outline-none hover:bg-foreground/[0.045] data-[state=open]:bg-foreground/[0.06]",
                isRail ? "justify-center px-0" : "px-1.5"
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-700 text-[11px] font-semibold text-white">
                {initials || "DB"}
              </span>
              {!isRail && (
                <>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[13px] font-medium text-foreground">{displayName}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{email || "Practitioner"}</span>
                  </span>
                  <ChevronsUpDown size={14} className="shrink-0 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isRail ? "right" : "top"} align={isRail ? "end" : "start"} sideOffset={8} className="w-60">
            <DropdownMenuLabel className="font-normal normal-case tracking-normal">
              <div className="truncate text-[13px] font-medium text-foreground">{displayName}</div>
              <div className="truncate text-xs text-muted-foreground">{email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 pb-1.5 pt-1 text-[11px] font-medium text-muted-foreground">Appearance</div>
            <div className="mx-1 mb-1 grid grid-cols-3 gap-1 rounded-lg bg-muted p-0.5">
              {[
                { id: "light", icon: Sun, label: "Light" },
                { id: "dark", icon: Moon, label: "Dark" },
                { id: "system", icon: Monitor, label: "Auto" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex h-7 items-center justify-center gap-1.5 rounded-md text-xs font-medium",
                    theme === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <t.icon size={13} /> {t.label}
                </button>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setIpadMode(true);
                close();
                navigate("/practice/clinical-hub");
              }}
            >
              <Tablet size={15} className="mr-2 text-muted-foreground" /> iPad mode
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/settings")}>
              <Settings size={15} className="mr-2 text-muted-foreground" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut} className="text-destructive focus:text-destructive">
              <LogOut size={15} className="mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isRail && !drawerOnly && (
          <RailTip show label="Expand  ⌘\">
            <button
              onClick={toggleCollapsed}
              className="mt-1 flex h-8 w-full items-center justify-center rounded-[7px] text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={16} strokeWidth={1.75} />
            </button>
          </RailTip>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop rail — skipped in drawer-only (iPad) mode, where the Sheet
          below is the sole navigation surface. */}
      {!drawerOnly && (
        <aside
          className={cn(
            "hidden h-full shrink-0 flex-col overflow-hidden border-r border-sidebar-border transition-[width] duration-300 ease-out-expo lg:flex print:hidden",
            collapsed ? "w-[60px]" : "w-[248px]"
          )}
        >
          {renderContent(collapsed, "desktop")}
        </aside>
      )}

      {/* Drawer — opened from the top bar's menu button */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-[280px] max-w-[86vw] border-r border-sidebar-border p-0 [&>button]:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {renderContent(false, "drawer")}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
