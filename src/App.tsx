import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import QuickCalibratePage from "./pages/QuickCalibratePage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { Loader2, PanelLeftOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";

const queryClient = new QueryClient();

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-indigo-200 animate-bounce">
          A
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">
          <Loader2 className="animate-spin" size={14} /> Initializing Practice
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      <MobileNav />
      {isSidebarVisible && <Sidebar onHide={() => setIsSidebarVisible(false)} />}
      
      <main className="flex-1 overflow-auto relative">
        {!isSidebarVisible && (
          <div className="hidden lg:block fixed top-6 left-6 z-50">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsSidebarVisible(true)}
              className="h-12 w-12 rounded-2xl bg-white border-slate-200 shadow-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
            >
              <PanelLeftOpen size={24} className="group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        )}
        {children}
      </main>
      <QuickActions />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedLayout><Index /></ProtectedLayout>} />
            <Route path="/clients" element={<ProtectedLayout><ClientsPage /></ProtectedLayout>} />
            <Route path="/clients/:id" element={<ProtectedLayout><ClientDetailPage /></ProtectedLayout>} />
            <Route path="/appointments" element={<ProtectedLayout><AppointmentsPage /></ProtectedLayout>} />
            <Route path="/appointments/:id" element={<ProtectedLayout><AppointmentDetailPage /></ProtectedLayout>} />
            <Route path="/oversight" element={<ProtectedLayout><ClinicalOversightPage /></ProtectedLayout>} />
            <Route path="/import" element={<ProtectedLayout><ImportPage /></ProtectedLayout>} />
            <Route path="/procedures" element={<ProtectedLayout><ProceduresPage /></ProtectedLayout>} />
            <Route path="/resources" element={<ProtectedLayout><ResourcesPage /></ProtectedLayout>} />
            <Route path="/self-practice" element={<ProtectedLayout><SelfPracticePage /></ProtectedLayout>} />
            <Route path="/north-star" element={<ProtectedLayout><NorthStarPage /></ProtectedLayout>} />
            <Route path="/week-3-worksheet" element={<ProtectedLayout><Week3WorksheetPage /></ProtectedLayout>} />
            <Route path="/quick-calibrate" element={<ProtectedLayout><QuickCalibratePage /></ProtectedLayout>} />
            <Route path="/debug" element={<ProtectedLayout><DebugAppointmentPage /></ProtectedLayout>} />
            <Route path="/demo-session" element={<ProtectedLayout><DemoSessionPage /></ProtectedLayout>} />
            <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;