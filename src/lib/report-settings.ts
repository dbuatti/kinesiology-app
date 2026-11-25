// Per-device session report preferences.
const SORT_PRIORITY_KEY = "rk_report_sort_priority";

export function getReportSortPriority(): boolean {
  try {
    const v = localStorage.getItem(SORT_PRIORITY_KEY);
    return v === null ? true : v === "true"; // on by default
  } catch {
    return true;
  }
}

export function setReportSortPriority(on: boolean) {
  try { localStorage.setItem(SORT_PRIORITY_KEY, String(on)); } catch { /* private mode */ }
}
