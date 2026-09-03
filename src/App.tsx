import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
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
const TimetablePage = lazy(() => import("./pages/timetable/TimetablePage"));
const AppointmentDetailPage = lazy(() => import("./pages/AppointmentDetailPage"));
const AppointmentV2Page = lazy(() => import("./pages/AppointmentV2Page"));
const ClinicalProtocolsPage = lazy(() => import("./pages/ClinicalProtocolsPage"));
const AllAppointmentsPage = lazy(() => import("./pages/AllAppointmentsPage"));

// --- Practitioner Pages ---
const IdentityWorkspacePage = lazy(() => import("./pages/IdentityWorkspacePage"));
const JournalPage = lazy(() => import("./pages/JournalPage"));
const PracticeHubPage = lazy(() => import("./pages/PracticeHubPage"));
const MorningProgramPage = lazy(() => import("./pages/MorningProgramPage"));

// --- Worksheets (consolidated into Library panes) ---

// --- Reference Pages ---
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const WorksheetsPage = lazy(() => import("./pages/WorksheetsPage"));
const PEACEFrameworkPage = lazy(() => import("./pages/PEACEFrameworkPage"));
const CogsLearningPage = lazy(() => import("./pages/CogsLearningPage"));
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
const GridSheetPage = lazy(() => import("./pages/GridSheetPage"));

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
const BusinessPage = lazy(() => import("./pages/BusinessPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ImportPage = lazy(() => import("./pages/ImportPage"));
const DebugAppointmentPage = lazy(() => import("./pages/DebugAppointmentPage"));
const DemoSessionPage = lazy(() => import("./pages/DemoSessionPage"));
const SiteAuditPage = lazy(() => import("./pages/SiteAuditPage"));
const WorkflowDebuggerPage = lazy(() => import("./pages/WorkflowDebuggerPage"));

const queryClient = new QueryClient();

const AppointmentV2Redirect = () => {
  const { id } = useParams();
  return <Navigate to={`/appointments/${id}`} replace />;
};

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
        <Route path="/appointments/:id/grid-sheet" element={session ? <GridSheetPage /> : <Navigate to="/login" replace />} />
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
          <Route path="/timetable" element={<TimetablePage />} />
          {/* Consolidated: sessions now live in the unified Calendar */}
          <Route path="/schedule" element={<Navigate to="/calendar" replace />} />
          <Route path="/appointments/:id" element={<AppointmentV2Page />} />
          <Route path="/appointments/:id/archive" element={<AppointmentDetailPage />} />
          <Route path="/appointments/:id/v2" element={<AppointmentV2Redirect />} />
          <Route path="/appointments/:id/protocols" element={<ClinicalProtocolsPage />} />
          {/* Clinical Oversight — consolidated into Clients hub */}
          <Route path="/oversight" element={<Navigate to="/clients?tool=oversight" replace />} />
          <Route path="/oversight/follow-up" element={<Navigate to="/business?tool=follow-up" replace />} />
          <Route path="/calendar" element={<UnifiedCalendarPage />} />
          {/* Sessions — consolidated Clinical Hub */}
          <Route path="/sessions" element={<ClinicalHubPage />} />

          {/* Practise */}
          <Route path="/morning-program" element={<MorningProgramPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/practice/journal" element={<Navigate to="/journal" replace />} />
          <Route path="/practice" element={<PracticeHubPage />} />
          <Route path="/practice/self" element={<Navigate to="/practice?tool=self-practice" replace />} />

          {/* Identity Work — consolidated hub */}
          <Route path="/identity" element={<IdentityWorkspacePage />} />
          <Route path="/identity-map" element={<Navigate to="/identity?tool=map" replace />} />
          <Route path="/identity-shifting" element={<Navigate to="/identity?tool=shifting" replace />} />
          <Route path="/identity-alignment" element={<Navigate to="/identity?tool=alignment" replace />} />
          <Route path="/limiting-beliefs" element={<Navigate to="/identity?tool=limiting" replace />} />
          <Route path="/fractals" element={<Navigate to="/identity?tool=fractals" replace />} />

          {/* Library — consolidated reference hub */}
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/resources" element={<Navigate to="/library" replace />} />
          <Route path="/resources/cogs" element={<CogsLearningPage />} />
          <Route path="/peace-framework" element={<PEACEFrameworkPage />} />
          {/* Practice tools — consolidated into Practice Hub */}
          <Route path="/practice/procedures" element={<Navigate to="/practice?tool=procedures" replace />} />
          <Route path="/practice/quiz" element={<Navigate to="/practice?tool=quiz" replace />} />
          <Route path="/practice/calibrate" element={<Navigate to="/practice?tool=calibrate" replace />} />
          <Route path="/practice/corrections" element={<Navigate to="/practice?tool=corrections" replace />} />

          {/* Worksheets — consolidated into Library panes */}
          {/* Worksheets — dedicated hub */}
          <Route path="/worksheets" element={<WorksheetsPage />} />
          <Route path="/resources/worksheets/north-star" element={<Navigate to="/worksheets?w=north-star" replace />} />
          <Route path="/resources/worksheets/week-3" element={<Navigate to="/worksheets?w=week-3" replace />} />
          <Route path="/resources/worksheets/fear-creativity" element={<Navigate to="/worksheets?w=fear-creativity" replace />} />
          <Route path="/resources/worksheets/inner-awareness" element={<Navigate to="/worksheets?w=inner-awareness" replace />} />
          <Route path="/resources/worksheets/anger-flow" element={<Navigate to="/worksheets?w=anger-flow" replace />} />
          <Route path="/resources/worksheets/business-model" element={<Navigate to="/worksheets?w=business-model" replace />} />
          <Route path="/resources/worksheets/where-your-value-begins" element={<Navigate to="/worksheets?w=where-your-value-begins" replace />} />
          <Route path="/resources/worksheets/money-security-freedom" element={<Navigate to="/worksheets?w=money-security-freedom" replace />} />
          <Route path="/resources/worksheets/business-strategy-diagnostic" element={<Navigate to="/worksheets?w=business-strategy-diagnostic" replace />} />

          {/* Voice Studio */}
          <Route path="/voice" element={<VoiceDashboardPage />} />
          <Route path="/voice/clients" element={<VoiceClientsPage />} />
          <Route path="/voice/clients/new" element={<VoiceNewClientPage />} />
          {/* Consolidated into the unified Calendar (book + view voice there) */}
          <Route path="/voice/book" element={<Navigate to="/calendar" replace />} />
          <Route path="/voice/calendar" element={<Navigate to="/calendar" replace />} />

          {/* Business — consolidated hub */}
          <Route path="/business" element={<BusinessPage />} />
          <Route path="/business/dashboard" element={<Navigate to="/business" replace />} />
          <Route path="/business/overview" element={<Navigate to="/business?tool=overview" replace />} />
          <Route path="/business/marketing-engine" element={<Navigate to="/business?tool=marketing" replace />} />
          <Route path="/business/client-audit" element={<Navigate to="/business?tool=client-audit" replace />} />
          <Route path="/business/follow-up" element={<Navigate to="/business?tool=follow-up" replace />} />

          {/* System */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/import" element={<ImportPage />} />
          <Route path="/settings/debug" element={<DebugAppointmentPage />} />
          <Route path="/settings/demo" element={<DemoSessionPage />} />
          <Route path="/settings/audit" element={<SiteAuditPage />} />
          <Route path="/settings/workflows" element={<WorkflowDebuggerPage />} />

          <Route path="/appointments" element={<AllAppointmentsPage />} />

          {/* Legacy Redirects */}

          <Route path="/resources/worksheets" element={<Navigate to="/worksheets" replace />} />
          <Route path="/lab" element={<Navigate to="/identity" replace />} />
          <Route path="/lab/identity-shifting" element={<Navigate to="/identity?tool=shifting" replace />} />
          <Route path="/lab/identity-alignment" element={<Navigate to="/identity?tool=alignment" replace />} />
          <Route path="/lab/limiting-beliefs" element={<Navigate to="/identity?tool=limiting" replace />} />
          <Route path="/lab/fractals" element={<Navigate to="/identity?tool=fractals" replace />} />
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
