import { Settings, Mail, Link as LinkIcon, Sparkles, Globe, Calendar, ExternalLink, FileText, Bug, FlaskConical, Workflow, ClipboardList, Eye, Share2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import IntegrationStatus from "../components/crm/settings/IntegrationStatus";
import StripeSettings from "../components/crm/settings/StripeSettings";
import PricingSettings from "../components/crm/settings/PricingSettings";
import UnmatchedPayments from "../components/crm/settings/UnmatchedPayments";
import NotionSettings from "../components/crm/settings/NotionSettings";
import CalcomSettings from "../components/crm/settings/CalcomSettings";
import DuplicateResolutionCenter from "../components/crm/settings/DuplicateResolutionCenter";
import AccountSettings from "../components/crm/settings/AccountSettings";
import DocumentationSettings from "../components/crm/settings/DocumentationSettings";
import AppearanceSettings from "../components/crm/settings/AppearanceSettings";

const CardLink = ({ to, icon: Icon, title, desc, badge }: { to: string; icon: any; title: string; desc: string; badge?: string }) => {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(to)} className="w-full flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border group hover:border-primary/40 transition-all text-left">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-foreground flex items-center gap-2">
            {title}
            {badge && <Badge className="bg-primary/10 text-primary border-none text-[9px] font-semibold">{badge}</Badge>}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">{desc}</p>
        </div>
      </div>
      <ExternalLink size={16} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const intakeFormUrl = `${window.location.origin}/onboarding/welcome`;
  const intakeDirectUrl = `${window.location.origin}/onboarding/{clientId}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
    }
  };

  return (
    <AppLayout variant="workspace">
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <PageHeader
          title="Settings"
          subtitle="Manage your account, appearance, integrations, and client experience."
          icon={Settings}
          iconClassName="bg-muted-foreground"
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="rounded-xl text-xs gap-2">
              <ArrowLeft size={14} /> Back
            </Button>
          }
        />

        <Tabs defaultValue="account" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 rounded-2xl border border-border/50 w-full max-w-lg grid grid-cols-3">
            <TabsTrigger value="account" className="rounded-xl font-bold text-xs py-2.5">Account</TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-xl font-bold text-xs py-2.5">Integrations</TabsTrigger>
            <TabsTrigger value="data" className="rounded-xl font-bold text-xs py-2.5">Data & Tools</TabsTrigger>
          </TabsList>

          {/* ════════════════════════════════════════════════
             ACCOUNT TAB
             ════════════════════════════════════════════════ */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppearanceSettings />
              <AccountSettings />
            </div>

            {/* Intake Form Preview */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-sm">Intake Form</h3>
                    <p className="text-xs text-muted-foreground font-medium">Client-facing Functional Neuro Health intake form. Sent automatically with booking confirmations.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => window.open("/onboarding/welcome", "_blank")} className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border group hover:border-primary/50 transition-all text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Eye size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">Preview Intake Form</p>
                        <p className="text-[10px] text-muted-foreground font-medium">See what clients see</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button onClick={() => { copyToClipboard(intakeDirectUrl); }} className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border group hover:border-primary/50 transition-all text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Share2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">Copy Intake Link Template</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Replace {`{clientId}`} with actual ID</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </div>

                <div className="mt-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">How it works</div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">1.</span>
                      <span>When a booking is created, <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">send-manual-onboarding</code> checks intake form completeness.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">2.</span>
                      <span>If &lt;50% of fields are filled, the email includes a "Complete Intake Form" CTA.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">3.</span>
                      <span>Client opens <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">/onboarding/:id</code> — 40+ fields across 10 sections.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">4.</span>
                      <span>Submissions update the <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">clients</code> table directly.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">5.</span>
                      <span>Payment link is <strong>always</strong> sent regardless of intake completion.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ════════════════════════════════════════════════
             INTEGRATIONS TAB
             ════════════════════════════════════════════════ */}
          <TabsContent value="integrations" className="space-y-6">
            {/* Integration Status Overview */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-sm">Integration Status</h3>
                  <p className="text-xs text-muted-foreground font-medium">Status of your linked clinical and marketing tools.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <IntegrationStatus name="Kit (ConvertKit)" icon={Mail} description="Marketing & Newsletter Sync" />
                <IntegrationStatus name="Notion" icon={LinkIcon} description="Clinical Database & Planner" />
                <IntegrationStatus name="Gmail API" icon={Sparkles} description="Automated Onboarding & Payment Emails" />
                <IntegrationStatus name="Cal.com" icon={Calendar} description="Booking & Scheduling" />
                <IntegrationStatus name="Stripe" icon={Settings} description="Payment Processing" />
                <IntegrationStatus name="Google Gemini" icon={Sparkles} description="AI Analysis & Content Generation" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CalcomSettings />
              <NotionSettings />
            </div>

            <StripeSettings />

            <PricingSettings />

            <UnmatchedPayments />
          </TabsContent>

          {/* ════════════════════════════════════════════════
             DATA & TOOLS TAB
             ════════════════════════════════════════════════ */}
          <TabsContent value="data" className="space-y-6">
            <DuplicateResolutionCenter />
            <DocumentationSettings />

            {/* Workflow Debugger */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-chart-emerald/10 text-chart-emerald flex items-center justify-center">
                    <Workflow size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-sm">Workflow Debugger</h3>
                    <p className="text-xs text-muted-foreground font-medium">Every booking workflow, email template, edge function, and client state transition across FNH and Voice.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/50 text-center">
                    <div className="text-lg font-black text-chart-emerald">11</div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Workflows</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/50 text-center">
                    <div className="text-lg font-black text-chart-emerald">12</div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Edge Functions</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/50 text-center">
                    <div className="text-lg font-black text-chart-emerald">10</div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Client States</div>
                  </div>
                </div>
                <button onClick={() => navigate("/settings/workflows")} className="w-full flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border group hover:border-chart-emerald/50 transition-all text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center text-chart-emerald group-hover:scale-110 transition-transform">
                      <Workflow size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">Open Workflow Debugger</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Inspect, filter, and expand all workflows</p>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground/40 group-hover:text-chart-emerald group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </div>
            </div>

            {/* Debug & Demo Tools */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                    <Bug size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-sm">Debug & Demo Tools</h3>
                    <p className="text-xs text-muted-foreground font-medium">Test harnesses, simulation tools, and diagnostic pages.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CardLink to="/settings/debug" icon={Bug} title="Appointment Debugger" desc="Test bookings, email sending, Stripe links, and Cal.com sync with real data" />
                  <CardLink to="/settings/demo" icon={FlaskConical} title="Demo Session" desc="Simulate a full clinical session with mock client data" />
                  <CardLink to="/settings/audit" icon={FileText} title="Site Audit" desc="Full text breakdown of all pages, routes, and components" />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
