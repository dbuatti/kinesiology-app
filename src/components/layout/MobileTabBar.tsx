import { Link, useLocation } from "react-router-dom";
import { motion, LayoutGroup } from "framer-motion";
import { Menu } from "lucide-react";
import { ZONES, activeNavPath } from "@/lib/zones";
import { useAppMode } from "@/components/ModeProvider";
import { cn } from "@/lib/utils";

/**
 * Phone/tablet navigation: a frosted bottom bar with the workspace's key
 * destinations one thumb-tap away, plus "More" for the full drawer.
 * Hidden on large screens, where the sidebar does this job.
 */
export function MobileTabBar({ onMore }: { onMore: () => void }) {
  const { mode } = useAppMode();
  const { pathname } = useLocation();
  const tabs = ZONES[mode].tabs.map((t) => ({ label: t.label, icon: t.icon, to: t.path }));
  const active = activeNavPath(tabs.map((t) => t.to), pathname);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 lg:hidden print:hidden"
    >
      <LayoutGroup id="mobile-tabs">
        <div className="mx-auto flex h-14 max-w-lg items-stretch px-2">
          {[...tabs, { label: "More", icon: Menu, to: "" }].map((t) => {
            const on = t.to !== "" && t.to === active;
            const inner = (
              <>
                {on && (
                  <motion.span
                    layoutId="mobile-tab-pill"
                    className="absolute inset-x-3 top-1.5 h-8 rounded-full bg-primary/10"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <t.icon size={20} strokeWidth={on ? 2.1 : 1.8} className={cn("relative mt-1.5 h-8", on ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("relative -mt-0.5 text-[10.5px] font-medium", on ? "text-foreground" : "text-muted-foreground")}>{t.label}</span>
              </>
            );
            const cls = "relative flex flex-1 flex-col items-center justify-start active:scale-95 transition-transform";
            return t.to ? (
              <Link key={t.label} to={t.to} className={cls} aria-current={on ? "page" : undefined}>
                {inner}
              </Link>
            ) : (
              <button key="more" onClick={onMore} className={cls} aria-label="Open full navigation">
                {inner}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}

export default MobileTabBar;
