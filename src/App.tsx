import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { ModeProvider } from "./components/ModeProvider";
import { ThemeProvider } from "./components/theme-provider";
import { Loader2 } from "lucide-react";
import ScrollToTop from "./components/shared/ScrollToTop";

// Layouts (kept eager — needed on every authenticated route)
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// --- Public & Auth Pages ---
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const OnboardingPage = lazy(() => import("./pages/public/OnboardingPage"));
const OnboardingLookupPage = lazy(() => import("./pages/public/OnboardingLookupPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// --- Clinical Hub Pages ---
const DashboardPage = lazy(() => import("./pages/app/DashboardPage"));
const ClientsPage = lazy(() => import("./pages/ClientsPage"));
const ClientDetailPage = lazy(() => import("./pages/ClientDetailPage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));
const AppointmentDetailPage = lazy(() => import("./pages/AppointmentDetailPage"));
const ClinicalProtocolsPage = lazy(() => import("./pages/ClinicalProtocolsPage"));
const ClinicalOversightPage = lazy(() => import("./pages/ClinicalOversightPage"));
const FollowUpPage = lazy(() => import("./pages/FollowUpPage"));
const AiPromptPage = lazy(() => import("./pages/AiPromptPage"));

// --- Practice Lab Pages ---
const LabPage = lazy(() => import("./pages/LabPage"));
const JournalPage = lazy(() => import("./pages/JournalPage"));
const SelfPracticePage = lazy(() => import("./pages/SelfPracticePage"));
const IdentityShiftingPage = lazy(() => import("./pages/IdentityShiftingPage"));
const IdentityAlignmentPage = lazy(() => import("./pages/IdentityAlignmentPage"));
const LimitingBeliefsPage = lazy(() => import("./pages/LimitingBeliefsPage"));
const FractalToolPage = lazy(() => import("./pages/FractalToolPage"));
const MorningProgramPage = lazy(() => import("./pages/MorningProgramPage"));

// --- Worksheets ---
const NorthStarPage = lazy(() => import("./pages/NorthStarPage"));
const Week3WorksheetPage = lazy(() => import("./pages/Week3WorksheetPage"));
const FearCreativityWorksheetPage = lazy(() => import("./pages/FearCreativityWorksheetPage"));
const InnerAwarenessWorksheetPage = lazy(() => import("./pages/InnerAwarenessWorksheetPage"));
const AngerFlowWorksheetPage = lazy(() => import("./pages/AngerFlowWorksheetPage"));
const BusinessModelWorksheetPage = lazy(() => import("./pages/BusinessModelWorksheetPage"));

// --- Knowledge & Reference ---
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const PEACEFrameworkPage = lazy(() => import("./pages/PEACEFrameworkPage"));
const CogsLearningPage = lazy(() => import("./pages/CogsLearningPage"));
const ProceduresPage = lazy(() => import("./pages/ProceduresPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const QuickCalibratePage = lazy(() => import("./pages/QuickCalibratePage"));
const PracticeNotes = lazy(() => import("./pages/PracticeNotes"));

// --- Print & Reference Sheets ---
const PrintHubPage = lazy(() => import("./pages/PrintHubPage"));
const CranialNervePrintPage = lazy(() => import("./pages/CranialNervePrintPage"));
const CranialNerveWorksheetPage = lazy(() => import("./pages/CranialNerveWorksheetPage"));
const PrimitiveReflexWorksheetPage = lazy(() => import("./pages/PrimitiveReflexWorksheetPage"));
const HeartWallPrintPage = lazy(() => import("./pages/HeartWallPrintPage"));
const BrainZonePrintPage = lazy(() => import("./pages/BrainZonePrintPage"));
const JointActionPrintPage = lazy(() => import("./pages/JointActionPrintPage"));

// --- Voice Studio ---
const VoiceDashboardPage = lazy(() => import("./pages/VoiceDashboardPage"));
const VoiceNewClientPage = lazy(() => import("./pages/VoiceNewClientPage"));
const VoiceClientsPage = lazy(() => import("./pages/VoiceClientsPage"));
const VoiceBookLessonPage = lazy(() => import("./pages/VoiceBookLessonPage"));
const VoiceCalendarPage = lazy(() => import("./pages/VoiceCalendarPage"));
const VoiceOnboardingPage = lazy(() => import("./pages/public/VoiceOnboardingPage"));
const UnifiedCalendarPage = lazy(() => import("./pages/UnifiedCalendarPage"));

// --- Business & System ---
const BusinessOverviewPage = lazy(() => import("./pages/BusinessOverviewPage"));
const BusinessDashboardPage = lazy(() => import("./pages/BusinessDashboardPage"));
const ClientAuditPage = lazy(() => import("./pages/ClientAuditPage"));
const MarketingEnginePage = lazy(() => import("./pages/MarketingEnginePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ImportPage = lazy(() => import("./pages/ImportPage"));
const DebugAppointmentPage = lazy(() => import("./pages/DebugAppointmentPage"));
const DemoSessionPage = lazy(() => import("./pages/DemoSessionPage"));
const SiteAuditPage = lazy(() => import("./pages/SiteAuditPage"));

const queryClient = new QueryClient();

const FullScreenLoader = ({ label }: { label: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl animate-bounce">
      A
    </div>
    <div className="flex items-center gap-2 text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em]">
      <Loader2 className="animate-spin" size={14} /> {label}
    </div>
  </div>
);

const AppRoutes = () => {
  const { session } = useAuth();

  if (session === undefined) {
    return <FullScreenLoader label="Initialising Practice" />;
  }

  return (
    <Suspense fallback={<FullScreenLoader label="Loading" />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding/welcome" element={<OnboardingLookupPage />} />
          <Route path="/onboarding/:id" element={<OnboardingPage />} />
        </Route>

        {/* Public Voice Onboarding (no auth required) */}
        <Route path="/voice-onboarding/:email" element={<VoiceOnboardingPage />} />

        {/* Protected App Routes */}
        <Route path="/notes-doc" element={session ? <PracticeNotes /> : <Navigate to="/login" replace />} />
        <Route path="/resources/cranial-nerves/print" element={session ? <CranialNervePrintPage /> : <Navigate to="/login" replace />} />
        <Route path="/resources/cranial-nerves/worksheet" element={session ? <CranialNerveWorksheetPage /> : <Navigate to="/login" replace />} />
        <Route path="/resources/primitive-reflexes/worksheet" element={session ? <PrimitiveReflexWorksheetPage /> : <Navigate to="/login" replace />} />
        <Route path="/resources/heart-wall/print" element={session ? <HeartWallPrintPage /> : <Navigate to="/login" replace />} />
        <Route path="/resources/brain-zones/print" element={session ? <BrainZonePrintPage /> : <Navigate to="/login" replace />} />
        <Route path="/resources/joint-actions/print" element={session ? <JointActionPrintPage /> : <Navigate to="/login" replace />} />
        <Route path="/resources/print" element={session ? <PrintHubPage /> : <Navigate to="/login" replace />} />

        <Route
          element={session ? <MainLayout /> : <Navigate to="/login" replace />}
        >
          <Route path="/" element={<DashboardPage />} />

          {/* Clinical Hub */}
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
          <Route path="/appointments/:id/protocols" element={<ClinicalProtocolsPage />} />
          <Route path="/oversight" element={<ClinicalOversightPage />} />
          <Route path="/oversight/follow-up" element={<FollowUpPage />} />
          <Route path="/resources/ai-prompt" element={<AiPromptPage />} />
          <Route path="/calendar" element={<UnifiedCalendarPage />} />

          {/* Practice Lab */}
          <Route path="/lab" element={<LabPage />} />
          <Route path="/practice/journal" element={<JournalPage />} />
          <Route path="/practice/self" element={<SelfPracticePage />} />
          <Route path="/morning-program" element={<MorningProgramPage />} />
          <Route path="/sandbox/identity-shifting" element={<IdentityShiftingPage />} />
          <Route path="/sandbox/identity-alignment" element={<IdentityAlignmentPage />} />
          <Route path="/sandbox/limiting-beliefs" element={<LimitingBeliefsPage />} />
          <Route path="/sandbox/fractals" element={<FractalToolPage />} />

          {/* Knowledge Base */}
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/cogs" element={<CogsLearningPage />} />
          <Route path="/peace-framework" element={<PEACEFrameworkPage />} />
          <Route path="/practice/procedures" element={<ProceduresPage />} />
          <Route path="/practice/quiz" element={<QuizPage />} />
          <Route path="/practice/calibrate" element={<QuickCalibratePage />} />

          {/* Worksheets */}
          <Route path="/resources/worksheets/north-star" element={<NorthStarPage />} />
          <Route path="/resources/worksheets/week-3" element={<Week3WorksheetPage />} />
          <Route path="/resources/worksheets/fear-creativity" element={<FearCreativityWorksheetPage />} />
          <Route path="/resources/worksheets/inner-awareness" element={<InnerAwarenessWorksheetPage />} />
          <Route path="/resources/worksheets/anger-flow" element={<AngerFlowWorksheetPage />} />
          <Route path="/resources/worksheets/business-model" element={<BusinessModelWorksheetPage />} />

          {/* Voice Studio */}
          <Route path="/voice" element={<VoiceDashboardPage />} />
          <Route path="/voice/clients" element={<VoiceClientsPage />} />
          <Route path="/voice/clients/new" element={<VoiceNewClientPage />} />
          <Route path="/voice/book" element={<VoiceBookLessonPage />} />
          <Route path="/voice/calendar" element={<VoiceCalendarPage />} />

          {/* Business Tools */}
          <Route path="/business" element={<Navigate to="/business/dashboard" replace />} />
          <Route path="/business/dashboard" element={<BusinessDashboardPage />} />
          <Route path="/business/overview" element={<BusinessOverviewPage />} />
          <Route path="/business/marketing-engine" element={<MarketingEnginePage />} />
          <Route path="/business/client-audit" element={<ClientAuditPage />} />

          {/* System */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/import" element={<ImportPage />} />
          <Route path="/settings/debug" element={<DebugAppointmentPage />} />
          <Route path="/settings/demo" element={<DemoSessionPage />} />
          <Route path="/settings/audit" element={<SiteAuditPage />} />

          {/* Legacy Redirects */}
          <Route path="/appointments" element={<Navigate to="/schedule?view=list" replace />} />
          <Route path="/availability" element={<Navigate to="/schedule?view=availability" replace />} />
          <Route path="/sandbox" element={<Navigate to="/lab?tab=map" replace />} />
          <Route path="/resources/worksheets" element={<Navigate to="/lab?tab=worksheets" replace />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <ModeProvider>
            <Toaster />
            <Sonner position="top-center" />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ScrollToTop />
              <AppRoutes />
            </BrowserRouter>
          </ModeProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
