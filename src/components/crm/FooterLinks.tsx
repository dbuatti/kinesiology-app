import { Link } from "react-router-dom";
import { ExternalLink, Home } from "lucide-react";

const FooterLinks = () => {
  return (
    <footer className="mt-16 border-t border-border/70 print:hidden">
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6">

          <div>
            <h4 className="mb-3 text-xs font-medium text-foreground/80">Navigate</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
                  <Home size={11} /> Home
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-medium text-foreground/80">Clinical Assets</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/resources/print" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  The Print Hub
                </Link>
              </li>
              <li>
                <Link to="/resources?tab=video" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Video Library
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-medium text-foreground/80">Reference</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://fnhrefapp-ggs6ojfk.manus.space/brain-zones" target="_blank" rel="noopener noreferrer" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                  FNH Ref App <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <Link to="/peace-framework" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  The PEACE Method
                </Link>
              </li>
              <li>
                <Link to="/practice/corrections" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Corrections Reference
                </Link>
              </li>
              <li>
                <Link to="/practice/clinical-hub" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Hub
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-medium text-foreground/80">Study</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://kin-videos.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                  My Study Videos <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <a href="https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations" target="_blank" rel="noopener noreferrer" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                  FNH Foundations <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <Link to="/practice/calibrate" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Quick Calibrate
                </Link>
              </li>
              <li>
                <Link to="/practice/quiz" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Knowledge Quiz
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-medium text-foreground/80">Practice</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/clients" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  People
                </Link>
              </li>
              <li>
                <Link to="/inbox" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Inbox
                </Link>
              </li>
              <li>
                <Link to="/calendar" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Calendar
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-medium text-foreground/80">Business</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/money" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Money
                </Link>
              </li>
              <li>
                <Link to="/audit" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Client audit
                </Link>
              </li>
              <li>
                <Link to="/marketing" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Marketing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-medium text-foreground/80">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://functional-neuro-health.notion.site/Functional-Neuro-Health-The-PEACE-Method-28beacafb4a88026b9a9ccdefa4e1de9" target="_blank" rel="noopener noreferrer" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                  Notion Manual <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <Link to="/settings" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
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
