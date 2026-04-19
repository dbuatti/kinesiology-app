import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { ThemeProvider } from "./components/theme-provider";
import { Loader2 } from "lucide-react";
import ScrollToTop from "./components/shared/ScrollToTop";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// Pages
import DashboardPage from "./pages/app/DashboardPage";
import LoginPage from "./pages/auth/LoginPage";
import OnboardingPage from "./pages/public/OnboardingPage";
import OnboardingLookupPage from "./pages/public/OnboardingLookupPage";
import ClientsPage from "./pages/ClientsPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import AppointmentDetailPage from "./pages/AppointmentDetailPage";
import CranialNerveAssessmentPage from "./pages/CranialNerveAssessmentPage";
import ImportPage from "./pages/ImportPage";
import ProceduresPage from "./pages/ProceduresPage";
import ResourcesPage from "./pages/ResourcesPage";
import SelfPracticePage from "./pages/SelfPracticePage";
import ClinicalOversightPage from "./pages/ClinicalOversightPage";
import DebugAppointmentPage from "./pages/DebugAppointmentPage";
import DemoSessionPage from "./pages/DemoSessionPage";
import SettingsPage from "./pages/SettingsPage";
import WorksheetsHubPage from "./pages/WorksheetsHubPage";
import NorthStarPage from "./pages/NorthStarPage";
import Week3WorksheetPage from "./pages/Week3WorksheetPage";
import FearCreativityWorksheetPage from "./pages/FearCreativityWorksheetPage";
import InnerAwarenessWorksheetPage from "./pages/InnerAwarenessWorksheetPage";
import AngerFlowWorksheetPage from "./pages/AngerFlowWorksheetPage";
import BusinessModelWorksheetPage from "./pages/BusinessModelWorksheetPage";
import QuickCalibratePage from "./pages/QuickCalibratePage";
import PEACEFrameworkPage from "./pages/PEACEFrameworkPage";
import MarketingEnginePage from "./pages/MarketingEnginePage";
import BusinessHubPage from "./pages/BusinessHubPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import SandboxPage from "./pages/SandboxPage";
import IdentityShiftingPage from "./pages/IdentityShiftingPage";
import IdentityAlignmentPage from "./pages/IdentityAlignmentPage";
import LimitingBeliefsPage from "./pages/LimitingBeliefsPage";
import JournalPage from "./pages/JournalPage";
import PracticeNotes from "./pages/PracticeNotes";
import QuizPage from "./pages/QuizPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { session } = useAuth();

  if (session === undefined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl animate-bounce">
          A
        </div>
        <div className="flex items-center gap-2 text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em]">
          <Loader2 className="animate-spin" size={14} /> Initializing Practice
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding/welcome" element={<OnboardingLookupPage />} />
        <Route path="/onboarding/:id" element={<OnboardingPage />} />
      </Route>

      {/* Protected App Routes */}
      <Route path="/notes-doc" element={session ? <PracticeNotes /> : <Navigate to="/login" replace />} />
      
      <Route
        element={session ? <MainLayout /> : <Navigate to="/login" replace />}
      >

        <Route path="/" element={<DashboardPage />} />
        
        {/* Clinical Hub */}
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
        <Route path="/appointments/:id/cranial-nerves" element={<CranialNerveAssessmentPage />} />
        <Route path="/oversight" element={<ClinicalOversightPage />} />
        <Route path="/availability" element={<AvailabilityPage />} />
        
        {/* Practice Lab */}
        <Route path="/practice/calibrate" element={<QuickCalibratePage />} />
        <Route path="/practice/self" element={<SelfPracticePage />} />
        <Route path="/practice/procedures" element={<ProceduresPage />} />
        <Route path="/practice/journal" element={<JournalPage />} />
        <Route path="/practice/quiz" element={<QuizPage />} />

        {/* Knowledge Base */}

        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/peace-framework" element={<PEACEFrameworkPage />} />
        <Route path="/resources/worksheets" element={<WorksheetsHubPage />} />
        <Route path="/resources/worksheets/north-star" element={<NorthStarPage />} />
        <Route path="/resources/worksheets/week-3" element={<Week3WorksheetPage />} />
        <Route path="/resources/worksheets/fear-creativity" element={<FearCreativityWorksheetPage />} />
        <Route path="/resources/worksheets/inner-awareness" element={<InnerAwarenessWorksheetPage />} />
        <Route path="/resources/worksheets/anger-flow" element={<AngerFlowWorksheetPage />} />
        <Route path="/resources/worksheets/business-model" element={<BusinessModelWorksheetPage />} />
        
        {/* Business Tools */}
        <Route path="/business" element={<BusinessHubPage />} />
        <Route path="/business/marketing-engine" element={<MarketingEnginePage />} />

        {/* Sandbox */}
        <Route path="/sandbox" element={<SandboxPage />} />
        <Route path="/sandbox/identity-shifting" element={<IdentityShiftingPage />} />
        <Route path="/sandbox/identity-alignment" element={<IdentityAlignmentPage />} />
        <Route path="/sandbox/limiting-beliefs" element={<LimitingBeliefsPage />} />

        {/* System */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/import" element={<ImportPage />} />
        <Route path="/settings/debug" element={<DebugAppointmentPage />} />
        <Route path="/settings/demo" element={<DemoSessionPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;