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
import DebugAppointmentPage from "./pages/DebugAppointmentPage";
import SettingsPage from "./pages/SettingsPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./components/AuthProvider";

const queryClient = new QueryClient();

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  
  if (session === undefined) return null; // Loading state
  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      <MobileNav />
      <Sidebar />
      <main className="flex-1 overflow-auto">
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
            <Route path="/import" element={<ProtectedLayout><ImportPage /></ProtectedLayout>} />
            <Route path="/procedures" element={<ProtectedLayout><ProceduresPage /></ProtectedLayout>} />
            <Route path="/resources" element={<ProtectedLayout><ResourcesPage /></ProtectedLayout>} />
            <Route path="/self-practice" element={<ProtectedLayout><SelfPracticePage /></ProtectedLayout>} />
            <Route path="/debug" element={<ProtectedLayout><DebugAppointmentPage /></ProtectedLayout>} />
            <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;