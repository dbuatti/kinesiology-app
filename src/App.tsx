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

// --- Clinic Pages ---
const DashboardPage = lazy(() => import("./pages/app/DashboardPage"));
const ClientsPage = lazy(() => import("./pages/ClientsPage"));
const ClientDetailPage = lazy(() => import("./pages/ClientDetailPage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));
const AppointmentDetailPage = lazy(() => import("./pages/AppointmentDetailPage"));
const AppointmentV2Page = lazy(() => import("./pages/AppointmentV2Page"));
const ClinicalProtocolsPage = lazy(() => import("./pages/ClinicalProtocolsPage"));
const ClinicalOversightPage = lazy(() => import("./pages/ClinicalOversightPage"));
const FollowUpPage = lazy(() => import("./pages/FollowUpPage"));
const AiPromptPage = lazy(() => import("./pages/AiPromptPage"));
const AllAppointmentsPage = lazy(() => import("./pages/AllAppointmentsPage"));

// --- Practitioner Pages ---
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
const ValueWorksheetPage = lazy(() => import("./pages/ValueWorksheetPage"));

// --- Reference Pages ---
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const PEACEFrameworkPage = lazy(() => import("./pages/PEACEFrameworkPage"));
const CogsLearningPage = lazy(() => import("./pages/CogsLearningPage"));
const ProceduresPage = lazy(() => import("./pages/ProceduresPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const QuickCalibratePage = lazy(() => import("./pages/QuickCalibratePage"));
const CorrectionsReferencePage = lazy(() => import("./pages/CorrectionsReferencePage"));
const CorrectionsManualPage = lazy(() => import("./pages/CorrectionsManualPage"));
const ClinicalHubPage = lazy(() => import("./pages/ClinicalHubPage"));
const SandboxV2Page = lazy(() => import("./pages/SandboxV2Page"));
const PracticeNotes = lazy(() => import("./pages/PracticeNotes"));

// --- Print & Reference Sheets ---
const PrintHubPage = lazy(() => import("./pages/PrintHubPage"));
const CranialNervePrintPage = lazy(() => import("./pages/CranialNervePrintPage"));
const CranialNerveWorksheetPage = lazy(() => import("./pages/CranialNerveWorksheetPage"));
const PrimitiveReflexWorksheetPage = lazy(() => import("./pages/PrimitiveReflexWorksheetPage"));
const HeartWallPrintPage = lazy(() => import("./pages/HeartWallPrintPage"));
const BrainZonePrintPage = lazy(() => import("./pages/BrainZonePrintPage"));
const JointActionPrintPage = lazy(() => import("./pages/JointActionPrintPage"));
const PathwayReflexStimPage = lazy(() => import("./pages/PathwayReflexStimPage"));

// --- Voice Studio ---
const VoiceDashboardPage = lazy(() => import("./pages/VoiceDashboardPage"));
const VoiceNewClientPage = lazy(() => import("./pages/VoiceNewClientPage"));
const VoiceClientsPage = lazy(() => import("./pages/VoiceClientsPage"));
// VoiceBookLessonPage / VoiceCalendarPage retired — consolidated into /calendar.
const VoiceOnboardingPage = lazy(() => import("./pages/public/VoiceOnboardingPage"));
const VoicePaidPage = lazy(() => import("./pages/public/VoicePaidPage"));
const OnboardingSuccessPage = lazy(() => import("./pages/public/OnboardingSuccessPage"));
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
const WorkflowDebuggerPage = lazy(() => import("./pages/WorkflowDebuggerPage"));

const queryClient = new QueryClient();

const FullScreenLoader = ({ label }: { label: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-primary-foreground font-black text-2xl shadow-2xl animate-bounce">
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

        {/* Public Stripe payment success pages (no auth required) */}
        <Route path="/voice/paid" element={<VoicePaidPage />} />
        <Route path="/onboarding/success" element={<OnboardingSuccessPage />} />

        {/* Protected App Routes */}
        <Route path="/notes-doc" element={session ? <PracticeNotes /> : <Navigate to="/login" replace />} />
        <Route path="/resources/cranial-nerves/print" element={session ? <CranialNervePrintPage /> : <Navigate to="/login" replace />} />
        <Route path="/resources/cranial-nerves/worksheet" element={session ? <CranialNerveWorksheetPage /> : <Navigate to="/login" replace />} />
        <Route path="/resources/primitive-reflexes/worksheet" element={session ? <PrimitiveReflexWorksheetPage /> : <Navigate to="/login" replace />} />
        <Route path="/resources/pathway-reflex-stim/print" element={session ? <PathwayReflexStimPage /> : <Navigate to="/login" replace />} />
        <Route path="/resources/heart-wall/print" element={session ? <HeartWallPrintPage /> : <Navigate to="/login" replace />} />
        <Route path="/resources/brain-zones/print" element={session ? <BrainZonePrintPage /> : <Navigate to="/login" replace />} />
        <Route path="/resources/joint-actions/print" element={session ? <JointActionPrintPage /> : <Navigate to="/login" replace />} />
        <Route path="/resources/print" element={session ? <PrintHubPage /> : <Navigate to="/login" replace />} />
        <Route path="/practice/corrections-manual" element={session ? <CorrectionsManualPage /> : <Navigate to="/login" replace />} />
        <Route path="/practice/clinical-hub" element={session ? <ClinicalHubPage /> : <Navigate to="/login" replace />} />
        <Route path="/practice/trial/peace" element={session ? <SandboxV2Page /> : <Navigate to="/login" replace />} />
        <Route path="/practice/trial/doc" element={session ? <SandboxV2Page /> : <Navigate to="/login" replace />} />

        <Route
          element={session ? <MainLayout /> : <Navigate to="/login" replace />}
        >
          <Route path="/" element={<DashboardPage />} />

          {/* Clinic */}
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/availability" element={<SchedulePage />} />
          {/* Consolidated: sessions now live in the unified Calendar */}
          <Route path="/schedule" element={<Navigate to="/calendar" replace />} />
          <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
          <Route path="/appointments/:id/v2" element={<AppointmentV2Page />} />
          <Route path="/appointments/:id/protocols" element={<ClinicalProtocolsPage />} />
          <Route path="/oversight" element={<ClinicalOversightPage />} />
          <Route path="/oversight/follow-up" element={<FollowUpPage />} />
          <Route path="/resources/ai-prompt" element={<AiPromptPage />} />
          <Route path="/calendar" element={<UnifiedCalendarPage />} />

          {/* Practitioner */}
          <Route path="/identity-map" element={<LabPage />} />
          <Route path="/practice/journal" element={<JournalPage />} />
          <Route path="/practice/self" element={<SelfPracticePage />} />
          <Route path="/morning-program" element={<MorningProgramPage />} />
          <Route path="/identity-shifting" element={<IdentityShiftingPage />} />
          <Route path="/identity-alignment" element={<IdentityAlignmentPage />} />
          <Route path="/limiting-beliefs" element={<LimitingBeliefsPage />} />
          <Route path="/fractals" element={<FractalToolPage />} />

          {/* Reference */}
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/cogs" element={<CogsLearningPage />} />
          <Route path="/peace-framework" element={<PEACEFrameworkPage />} />
          <Route path="/practice/procedures" element={<ProceduresPage />} />
          <Route path="/practice/quiz" element={<QuizPage />} />
          <Route path="/practice/calibrate" element={<QuickCalibratePage />} />
          <Route path="/practice/corrections" element={<CorrectionsReferencePage />} />

          {/* Worksheets */}
          <Route path="/resources/worksheets/north-star" element={<NorthStarPage />} />
          <Route path="/resources/worksheets/week-3" element={<Week3WorksheetPage />} />
          <Route path="/resources/worksheets/fear-creativity" element={<FearCreativityWorksheetPage />} />
          <Route path="/resources/worksheets/inner-awareness" element={<InnerAwarenessWorksheetPage />} />
          <Route path="/resources/worksheets/anger-flow" element={<AngerFlowWorksheetPage />} />
          <Route path="/resources/worksheets/business-model" element={<BusinessModelWorksheetPage />} />
          <Route path="/resources/worksheets/where-your-value-begins" element={<ValueWorksheetPage />} />

          {/* Voice Studio */}
          <Route path="/voice" element={<VoiceDashboardPage />} />
          <Route path="/voice/clients" element={<VoiceClientsPage />} />
          <Route path="/voice/clients/new" element={<VoiceNewClientPage />} />
          {/* Consolidated into the unified Calendar (book + view voice there) */}
          <Route path="/voice/book" element={<Navigate to="/calendar" replace />} />
          <Route path="/voice/calendar" element={<Navigate to="/calendar" replace />} />

          {/* Business Tools */}
          <Route path="/business" element={<Navigate to="/business/dashboard" replace />} />
          <Route path="/business/dashboard" element={<BusinessDashboardPage />} />
          <Route path="/business/overview" element={<BusinessOverviewPage />} />
          <Route path="/business/marketing-engine" element={<MarketingEnginePage />} />
          <Route path="/business/client-audit" element={<ClientAuditPage />} />
          <Route path="/business/follow-up" element={<FollowUpPage />} />

          {/* System */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/import" element={<ImportPage />} />
          <Route path="/settings/debug" element={<DebugAppointmentPage />} />
          <Route path="/settings/demo" element={<DemoSessionPage />} />
          <Route path="/settings/audit" element={<SiteAuditPage />} />
          <Route path="/settings/workflows" element={<WorkflowDebuggerPage />} />

          <Route path="/appointments" element={<AllAppointmentsPage />} />

          {/* Legacy Redirects */}

          <Route path="/resources/worksheets" element={<Navigate to="/resources?tab=worksheets" replace />} />
          <Route path="/lab" element={<Navigate to="/identity-map" replace />} />
          <Route path="/lab/identity-shifting" element={<Navigate to="/identity-shifting" replace />} />
          <Route path="/lab/identity-alignment" element={<Navigate to="/identity-alignment" replace />} />
          <Route path="/lab/limiting-beliefs" element={<Navigate to="/limiting-beliefs" replace />} />
          <Route path="/lab/fractals" element={<Navigate to="/fractals" replace />} />
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
