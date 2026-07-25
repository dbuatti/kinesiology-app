import { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/components/crm/AppLayout';
import PageHeader from '@/components/shared/PageHeader';
import { SITE_MAP, type PageAudit } from '@/utils/site-audit';
import {
  FileText, Printer, Copy, Check, ChevronRight, ShieldCheck,
  Info, Search, CheckCircle2, XCircle, Database, Route, AlertTriangle,
  Loader2, RefreshCw, Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';

const ACTUAL_ROUTES = new Set([
  "/", "/login", "/onboarding/welcome", "/onboarding/:id", "/voice-onboarding/:email",
  "/notes-doc", "/resources/cranial-nerves/print", "/resources/cranial-nerves/worksheet",
  "/resources/primitive-reflexes/worksheet", "/resources/heart-wall/print",
  "/resources/brain-zones/print", "/resources/joint-actions/print", "/resources/print",
  "/clients", "/clients/:id", "/availability", "/schedule", "/appointments/:id",
  "/appointments/:id/protocols", "/oversight", "/oversight/follow-up",
  "/resources/ai-prompt", "/calendar",
  "/identity-map", "/practice/journal", "/practice/self", "/morning-program",
  "/identity-shifting", "/identity-alignment", "/limiting-beliefs", "/fractals",
  "/resources", "/resources/cogs", "/peace-framework", "/practice/procedures",
  "/practice/quiz", "/practice/calibrate", "/practice/corrections",
  "/resources/worksheets/north-star", "/resources/worksheets/week-3",
  "/resources/worksheets/fear-creativity", "/resources/worksheets/inner-awareness",
  "/resources/worksheets/anger-flow", "/resources/worksheets/business-model",
  "/resources/worksheets/where-your-value-begins",
  "/voice", "/voice/clients", "/voice/clients/new",
  "/business", "/business/dashboard", "/business/overview",
  "/business/marketing-engine", "/business/client-audit", "/business/follow-up",
  "/settings", "/settings/import", "/settings/debug", "/settings/demo",
  "/settings/audit", "/settings/workflows",
  "/voice/paid", "/onboarding/success",
]);

const TABLE_AUDIT = [
  "appointments", "clients", "voice_bookings", "profiles",
  "event_pricing", "webhook_failures", "voice_onboarding",
  "client_wins",
] as const;

interface TableHealth {
  name: string;
  status: "loading" | "ok" | "error";
  count: number | null;
  detail?: string;
}

const SiteAuditPage = () => {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [tableHealth, setTableHealth] = useState<TableHealth[]>(TABLE_AUDIT.map(t => ({ name: t, status: "loading", count: null })));
  const [auditing, setAuditing] = useState(false);

  const runAudit = async () => {
    setAuditing(true);
    setTableHealth(TABLE_AUDIT.map(t => ({ name: t, status: "loading", count: null })));
    const results = await Promise.allSettled(
      TABLE_AUDIT.map(async (name) => {
        const { count, error } = await supabase
          .from(name)
          .select("*", { count: "exact", head: true });
        if (error) throw error;
        return { name, count: count ?? 0 };
      })
    );
    setTableHealth(results.map((r, i) => {
      if (r.status === "fulfilled") return { name: TABLE_AUDIT[i], status: "ok" as const, count: r.value.count };
      return { name: TABLE_AUDIT[i], status: "error" as const, count: null, detail: String(r.reason) };
    }));
    setAuditing(false);
    showSuccess("Database audit complete");
  };

  useEffect(() => { runAudit(); }, []);

  const annotated = useMemo(() =>
    SITE_MAP.map(p => ({
      ...p,
      routeExists: ACTUAL_ROUTES.has(p.path),
    })),
  []);

  const covered = annotated.filter(p => p.routeExists).length;
  const missing = annotated.filter(p => !p.routeExists);

  const filtered = annotated.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopyMarkdown = () => {
    let md = "# Resonance CRM: Site Audit & Content Breakdown\n\n";
    annotated.forEach(p => {
      md += `## ${p.title}\n`;
      md += `**Path:** \`${p.path}\`  \n`;
      md += `**Status:** ${p.routeExists ? "✅ Route exists" : "❌ Route not found"}  \n`;
      md += `**Category:** ${p.category}  \n`;
      md += `**Description:** ${p.description}\n\n`;
      md += `**Key Features:**\n`;
      p.keyFeatures.forEach(f => md += `- ${f}\n`);
      md += `\n---\n\n`;
    });
    if (missing.length) {
      md += `## Missing Routes\n`;
      missing.forEach(p => { md += `- ${p.title} (\`${p.path}\`)\n`; });
      md += `\n`;
    }
    navigator.clipboard.writeText(md);
    setCopied(true);
    showSuccess("Markdown breakdown copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <PageHeader
          title="Site Audit & Breakdown"
          subtitle={`${annotated.length} documented pages · ${covered} verified routes`}
          icon={FileText}
          actions={
            <div className="flex gap-3 print:hidden">
              <Button variant="outline" onClick={handleCopyMarkdown} className="rounded-xl h-12 px-6 font-bold border-indigo-100 text-indigo-600">
                {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
                Copy Markdown
              </Button>
              <Button onClick={() => window.print()} className="bg-card hover:bg-card text-white rounded-xl h-12 px-6 font-bold">
                <Printer size={18} className="mr-2" /> Print Audit
              </Button>
            </div>
          }
        />

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="text-lg font-black text-indigo-600">{annotated.length}</div>
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Documented Pages</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="text-lg font-black text-emerald-600">{covered}</div>
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Verified Routes</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="text-lg font-black text-amber-600">{missing.length}</div>
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Missing Routes</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="text-lg font-black text-rose-600">{tableHealth.filter(t => t.status === "error").length}</div>
            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">DB Issues</div>
          </div>
        </div>

        {/* Database audit */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 flex items-center justify-center"><Database size={16} /></div>
              <div>
                <h3 className="font-black text-foreground text-sm">Database Audit</h3>
                <p className="text-xs text-muted-foreground font-medium">{tableHealth.filter(t => t.status === "ok").length}/{TABLE_AUDIT.length} tables accessible</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={runAudit} disabled={auditing} className="rounded-xl text-xs">
              {auditing ? <Loader2 size={12} className="animate-spin mr-1" /> : <RefreshCw size={12} className="mr-1" />}
              {auditing ? "Scanning..." : "Re-scan"}
            </Button>
          </div>
          <div className="px-5 pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tableHealth.map(t => (
                <div key={t.name} className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border text-xs",
                  t.status === "loading" ? "border-border bg-muted/30" :
                  t.status === "ok" ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20" :
                  "border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20"
                )}>
                  {t.status === "loading" ? <Loader2 size={12} className="animate-spin text-muted-foreground" /> :
                   t.status === "ok" ? <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> :
                   <XCircle size={12} className="text-rose-500 shrink-0" />}
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{t.name}</div>
                    <div className="text-muted-foreground">
                      {t.status === "loading" ? "..." :
                       t.status === "ok" ? `${t.count?.toLocaleString()} rows` :
                       "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md print:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Filter pages..."
            className="pl-10 h-12 rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Page list */}
        <div className="grid grid-cols-1 gap-6">
          {filtered.map((page) => (
            <div key={page.path} className={cn(
              "rounded-2xl border overflow-hidden transition-all",
              page.routeExists ? "border-border bg-card" : "border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10"
            )}>
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={cn(
                        "border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full",
                        page.category === 'Clinical' ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" :
                        page.category === 'Practice' ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" :
                        page.category === 'Business' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" :
                        "bg-muted text-muted-foreground dark:bg-card dark:text-foreground"
                      )}>
                        {page.category}
                      </Badge>
                      <code className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border">
                        {page.path}
                      </code>
                      {page.routeExists
                        ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-none text-[9px] font-semibold"><CheckCircle2 size={10} className="mr-1" />Route verified</Badge>
                        : <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-none text-[9px] font-semibold"><AlertTriangle size={10} className="mr-1" />Route missing</Badge>}
                    </div>

                    <h3 className="text-xl font-black text-foreground">{page.title}</h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-3xl">
                      {page.description}
                    </p>

                    <div className="pt-2 space-y-2">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Key Components</p>
                      <div className="flex flex-wrap gap-2">
                        {page.keyFeatures.map(feature => (
                          <span key={feature} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted/50 border border-border text-xs font-semibold text-muted-foreground">
                            <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="p-8 bg-foreground text-background rounded-[2rem] border shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-lg font-black">Audit Summary</h4>
              <p className="text-muted-foreground font-medium text-sm">
                {covered}/{annotated.length} documented pages verified against {ACTUAL_ROUTES.size} registered routes.
                {missing.length > 0 && ` ${missing.length} documented page${missing.length > 1 ? 's' : ''} without a matching route.`}
                {' '}{tableHealth.filter(t => t.status === "ok").length}/{TABLE_AUDIT.length} database tables accessible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SiteAuditPage;
