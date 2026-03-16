import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/crm/Sidebar";
import MobileNav from "./components/crm/MobileNav";
import QuickActions from "./components/crm/QuickActions";
import Index from "./pages/Index";
import ClientsPage from "./pages/ClientsPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import AppointmentDetailPage from "./pages/AppointmentDetailPage";
import ImportPage from "./pages/ImportPage";
import ProceduresPage from "./pages/ProceduresPage";
import ResourcesPage from "./pages/ResourcesPage";
import SelfPracticePage from "./pages/SelfPracticePage";
import ClinicalOversightPage from "./pages/ClinicalOversightPage";
import DebugAppointmentPage from "./pages/DebugAppointmentPage";
import DemoSessionPage from "./pages/DemoSessionPage";
import SettingsPage from "./pages/SettingsPage";
import NorthStarPage from "./pages/NorthStarPage";
import Week3WorksheetPage from "./pages/Week3WorksheetPage";
import FearCreativityWorksheetPage from "./pages/FearCreativityWorksheetPage";
import QuickCalibratePage from "./pages/QuickCalibratePage";
import OnboardingPage from "./pages/OnboardingPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { ThemeProvider } from "./components/theme-provider";
import { Loader2, PanelLeftOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import PageTransition from "./components/crm/PageTransition";
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  const { session } = useAuth();
  const [isSidebarVisible, setIsSidebarVisible] = useState(() => {
    const saved = localStorage.getItem("antigravity_sidebar_visible");
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  useEffect(() => {
    localStorage.setItem("antigravity_sidebar_visible", JSON.stringify(isSidebarVisible));
  }, [isSidebarVisible]);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/20 animate-bounce">
          A
        </div>
        <div className="flex items-center gap-2 text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em]">
          <Loader2 className="animate-spin" size={14} /> Initializing Practice
        </div>
      </div>
    );
  }

  if (!session && location.pathname !== "/login" && !location.pathname.startsWith("/onboarding/")) {
    return <Navigate to="/login" replace />;
  }

  const isPublicRoute = location.pathname === "/login" || location.pathname.startsWith("/onboarding/");

  if (isPublicRoute) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/onboarding/:id" element={<PageTransition><OnboardingPage /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <MobileNav />
      {isSidebarVisible && <Sidebar onHide={() => setIsSidebarVisible(false)} />}
      
      <main className="flex-1 overflow-auto relative">
        {!isSidebarVisible && (
          <div className="hidden lg:block fixed top-6 left-6 z-50">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsSidebarVisible(true)}
              className="h-12 w-12 rounded-2xl bg-card border-border shadow-xl hover:bg-accent hover:text-indigo-600 transition-all group"
            >
              <PanelLeftOpen size={24} className="group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        )}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Index /></PageTransition>} />
            
            {/* Clinical Hub */}
            <Route path="/clients" element={<PageTransition><ClientsPage /></PageTransition>} />
            <Route path="/clients/:id" element={<PageTransition><ClientDetailPage /></PageTransition>} />
            <Route path="/appointments" element={<PageTransition><AppointmentsPage /></PageTransition>} />
            <Route path="/appointments/:id" element={<PageTransition><AppointmentDetailPage /></PageTransition>} />
            <Route path="/oversight" element={<PageTransition><ClinicalOversightPage /></PageTransition>} />
            
            {/* Practice Lab */}
            <Route path="/practice">
              <Route path="calibrate" element={<PageTransition><QuickCalibratePage /></PageTransition>} />
              <Route path="self" element={<PageTransition><SelfPracticePage /></PageTransition>} />
              <Route path="procedures" element={<PageTransition><ProceduresPage /></PageTransition>} />
            </Route>

            {/* Knowledge Base */}
            <Route path="/resources" element={<PageTransition><ResourcesPage /></PageTransition>} />
            <Route path="/resources/worksheets">
              <Route path="north-star" element={<PageTransition><NorthStarPage /></PageTransition>} />
              <Route path="week-3" element={<PageTransition><Week3WorksheetPage /></PageTransition>} />
              <Route path="fear-creativity" element={<PageTransition><FearCreativityWorksheetPage /></PageTransition>} />
            </Route>
            
            {/* System & Settings */}
            <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
            <Route path="/settings/import" element={<PageTransition><ImportPage /></PageTransition>} />
            <Route path="/settings/debug" element={<PageTransition><DebugAppointmentPage /></PageTransition>} />
            <Route path="/settings/demo" element={<PageTransition><DemoSessionPage /></PageTransition>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      <QuickActions />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;