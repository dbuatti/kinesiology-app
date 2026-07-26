import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { BookOpen, FileText, LayoutDashboard } from "lucide-react";
import CorrectionsManualContent from "@/components/crm/CorrectionsManualContent";
import FooterLinks from "@/components/crm/FooterLinks";

const CorrectionsManualPage = () => {
  const { session } = useAuth();

  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={18} className="text-muted-foreground" />
            <h1 className="text-sm font-semibold tracking-tight">Corrections Manual</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/practice/clinical-hub"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider border border-foreground/20 hover:bg-foreground hover:text-primary-foreground transition-colors no-underline"
            >
              <LayoutDashboard size={12} /> Hub
            </Link>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <CorrectionsManualContent />
      </div>
      <FooterLinks />
    </div>
  );
};

export default CorrectionsManualPage;
