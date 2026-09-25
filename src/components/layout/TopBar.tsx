import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "@/components/crm/SearchBar";
import QuickActions from "@/components/crm/QuickActions";
import UpcomingMarquee from "@/components/crm/UpcomingMarquee";

interface TopBarProps {
  section: string;
  sectionTo: string;
  title: string;
  /** Also show the menu button on large screens (iPad mode hides the rail). */
  menuDesktop?: boolean;
  /** Hide the whole bar on large screens (e.g. the session page has its own header). */
  mobileOnly?: boolean;
  showUpNext?: boolean;
  onMenu: () => void;
  /** Content has scrolled under the bar — show its surface + hairline. */
  scrolled?: boolean;
}

/**
 * The app's single top bar: where-am-I breadcrumb on the left; live "up
 * next", search (⌘K), create (+ New) and theme on the right. Replaces the
 * old full-width "Up Next" strip and the floating + button, so nothing
 * hovers over page content any more.
 */
export function TopBar({ section, sectionTo, title, menuDesktop, mobileOnly, showUpNext = true, onMenu, scrolled = false }: TopBarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header
      className={cn(
        "relative z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center gap-2 border-b px-3 transition-[background-color,border-color,box-shadow] duration-300 sm:px-4 lg:h-[calc(52px+env(safe-area-inset-top))] lg:px-6 print:hidden",
        scrolled
          ? "border-border/80 bg-topbar/80 shadow-[0_1px_12px_-6px_hsl(var(--shadow-color)/0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-topbar/65"
          : "border-transparent bg-transparent",
        "pt-[env(safe-area-inset-top)]",
        mobileOnly && "lg:hidden"
      )}
    >
      <button
        onClick={onMenu}
        aria-label="Open navigation"
        className={cn(
          "-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-foreground/[0.05]",
          !menuDesktop && "lg:hidden"
        )}
      >
        <Menu size={19} strokeWidth={1.9} />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[13px]">
        {section && section !== title && (
          <>
            <Link to={sectionTo} className="hidden shrink-0 rounded-md px-1.5 py-1 text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground sm:inline">
              {section}
            </Link>
            <ChevronRight size={13} className="hidden shrink-0 text-muted-foreground/50 sm:inline" />
          </>
        )}
        <span className="truncate px-1.5 font-medium text-foreground">{title}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        {showUpNext && <UpcomingMarquee className="hidden md:inline-flex" />}
        <div className="lg:w-60 xl:w-72">
          <SearchBar responsive />
        </div>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
          className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground sm:flex"
        >
          <Sun size={16} strokeWidth={1.9} className="hidden dark:block" />
          <Moon size={16} strokeWidth={1.9} className="dark:hidden" />
        </button>
        <div className="ml-0.5">
          <QuickActions />
        </div>
      </div>
    </header>
  );
}

export default TopBar;
