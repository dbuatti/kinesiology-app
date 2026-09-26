// Where the app opens: Today (default), Inbox, or Calendar. A per-device
// preference, so localStorage is the right home (wrapped: it can throw in
// private mode). MainLayout applies it once per browser session, when the
// app first loads on "/", so tapping Today later still goes to Today.
export const START_PAGES = [
  { path: "/", label: "Today" },
  { path: "/inbox", label: "Inbox" },
  { path: "/calendar", label: "Calendar" },
] as const;

export type StartPage = (typeof START_PAGES)[number]["path"];

const KEY = "rk_start_page";
const SESSION_FLAG = "rk_start_page_applied";

export function getStartPage(): StartPage {
  try {
    const v = localStorage.getItem(KEY);
    return START_PAGES.some((p) => p.path === v) ? (v as StartPage) : "/";
  } catch {
    return "/";
  }
}

export function setStartPage(path: StartPage) {
  try { localStorage.setItem(KEY, path); } catch { /* private mode */ }
}

/** The page to redirect to on first load this session, or null to stay put. Marks the session as handled. */
export function takeStartRedirect(pathname: string): StartPage | null {
  try {
    if (sessionStorage.getItem(SESSION_FLAG)) return null;
    sessionStorage.setItem(SESSION_FLAG, "1");
  } catch {
    return null;
  }
  const start = getStartPage();
  return pathname === "/" && start !== "/" ? start : null;
}
