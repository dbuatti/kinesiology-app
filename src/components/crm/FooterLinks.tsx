import { Link } from "react-router-dom";
import { Printer, Globe, GraduationCap, Workflow, BookOpen, ExternalLink } from "lucide-react";

const FooterLinks = () => {
  return (
    <footer className="border-t border-border bg-muted/30 mt-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Clinical Assets</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/resources/print" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  The Print Hub
                </Link>
              </li>
              <li>
                <Link to="/resources?tab=video" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Video Library
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Reference</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://fnhrefapp-ggs6ojfk.manus.space/brain-zones" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                  FNH Ref App <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <Link to="/peace-framework" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  The PEACE Method
                </Link>
              </li>
              <li>
                <Link to="/practice/corrections" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Corrections Reference
                </Link>
              </li>
              <li>
                <Link to="/practice/clinical-hub" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Hub
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Study</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://kin-videos.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                  My Study Videos <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <a href="https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                  FNH Foundations <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <Link to="/practice/calibrate" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Quick Calibrate
                </Link>
              </li>
              <li>
                <Link to="/practice/quiz" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Knowledge Quiz
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Practice</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/clients" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Client Database
                </Link>
              </li>
              <li>
                <Link to="/oversight/follow-up" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Client Follow-Up
                </Link>
              </li>
              <li>
                <Link to="/schedule" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Schedule
                </Link>
              </li>
              <li>
                <Link to="/calendar" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Calendar
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://functional-neuro-health.notion.site/Functional-Neuro-Health-The-PEACE-Method-28beacafb4a88026b9a9ccdefa4e1de9" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                  Notion Manual <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <Link to="/settings" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-muted-foreground/60">
          <span>Resonance Kinesiology Practice Suite</span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default FooterLinks;
