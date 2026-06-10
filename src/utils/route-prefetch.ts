// Hover-prefetch for lazily loaded routes.
// Maps nav paths to their dynamic imports so chunks start downloading
// before the user clicks, making navigation feel instant.

const prefetchMap: Record<string, () => Promise<unknown>> = {
  "/": () => import("@/pages/app/DashboardPage"),
  "/clients": () => import("@/pages/ClientsPage"),
  "/schedule": () => import("@/pages/SchedulePage"),
  "/oversight": () => import("@/pages/ClinicalOversightPage"),
  "/calendar": () => import("@/pages/UnifiedCalendarPage"),
  "/voice": () => import("@/pages/VoiceDashboardPage"),
  "/voice/clients": () => import("@/pages/VoiceClientsPage"),
  "/voice/book": () => import("@/pages/VoiceBookLessonPage"),
  "/voice/calendar": () => import("@/pages/VoiceCalendarPage"),
  "/business/dashboard": () => import("@/pages/BusinessDashboardPage"),
  "/business/overview": () => import("@/pages/BusinessOverviewPage"),
  "/business/marketing-engine": () => import("@/pages/MarketingEnginePage"),
  "/business/client-audit": () => import("@/pages/ClientAuditPage"),
  "/morning-program": () => import("@/pages/MorningProgramPage"),
  "/practice/journal": () => import("@/pages/JournalPage"),
  "/lab": () => import("@/pages/LabPage"),
  "/practice/self": () => import("@/pages/SelfPracticePage"),
  "/resources": () => import("@/pages/ResourcesPage"),
  "/peace-framework": () => import("@/pages/PEACEFrameworkPage"),
  "/practice/procedures": () => import("@/pages/ProceduresPage"),
  "/practice/quiz": () => import("@/pages/QuizPage"),
  "/practice/calibrate": () => import("@/pages/QuickCalibratePage"),
};

const prefetched = new Set<string>();

export const prefetchRoute = (path: string) => {
  if (prefetched.has(path)) return;
  const loader = prefetchMap[path];
  if (!loader) return;
  prefetched.add(path);
  loader().catch(() => prefetched.delete(path)); // allow retry on failure
};
