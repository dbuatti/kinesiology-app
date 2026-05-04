"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/crm/AppLayout';
import PageHeader from '@/components/shared/PageHeader';
import { SITE_MAP } from '@/utils/site-audit';
import { 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  ChevronRight, 
  LayoutGrid, 
  ShieldCheck,
  Info,
  ExternalLink,
  Search,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';

const SiteAuditPage = () => {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const filtered = SITE_MAP.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopyMarkdown = () => {
    let md = "# Resonance CRM: Site Audit & Content Breakdown\n\n";
    SITE_MAP.forEach(p => {
      md += `## ${p.title}\n`;
      md += `**Path:** \`${p.path}\`  \n`;
      md += `**Category:** ${p.category}  \n`;
      md += `**Description:** ${p.description}\n\n`;
      md += `**Key Features:**\n`;
      p.keyFeatures.forEach(f => md += `- ${f}\n`);
      md += `\n---\n\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    showSuccess("Markdown breakdown copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-10 animate-in fade-in duration-700 pb-20">
        <PageHeader 
          title="Site Audit & Breakdown"
          subtitle="A complete architectural map of the Resonance application and its content."
          icon={FileText}
          breadcrumbs={[{ label: "Settings", path: "/settings" }, { label: "Site Audit" }]}
          actions={
            <div className="flex gap-3 print:hidden">
              <Button variant="outline" onClick={handleCopyMarkdown} className="rounded-xl h-12 px-6 font-bold border-indigo-100 text-indigo-600">
                {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
                Copy Markdown
              </Button>
              <Button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-6 font-bold">
                <Printer size={18} className="mr-2" /> Print Audit
              </Button>
            </div>
          }
        />

        <div className="relative max-w-md print:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Filter pages..." 
            className="pl-10 h-12 rounded-2xl border-slate-200 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filtered.map((page) => (
            <Card key={page.path} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden group hover:shadow-md transition-all border-l-4 border-l-indigo-500">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <Badge className={cn(
                        "border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full",
                        page.category === 'Clinical' ? "bg-rose-100 text-rose-700" :
                        page.category === 'Practice' ? "bg-indigo-100 text-indigo-700" :
                        page.category === 'Business' ? "bg-emerald-100 text-emerald-700" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {page.category}
                      </Badge>
                      <code className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {page.path}
                      </code>
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-900">{page.title}</h3>
                    <p className="text-slate-600 font-medium leading-relaxed max-w-3xl">
                      {page.description}
                    </p>

                    <div className="pt-4 space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Functional Components</p>
                      <div className="flex flex-wrap gap-2">
                        {page.keyFeatures.map(feature => (
                          <span key={feature} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden print:bg-slate-50 print:text-slate-900 print:border-2 print:border-slate-200">
          <div className="absolute top-0 right-0 p-12 opacity-10 print:hidden"><ShieldCheck size={150} /></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xl print:hidden">
              <Info size={40} className="text-white" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black">Audit Summary</h4>
              <p className="text-slate-400 print:text-slate-600 font-medium leading-relaxed">
                This breakdown covers the core architectural layers of the Resonance CRM. It is designed for documentation, SEO planning, and clinical workflow review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SiteAuditPage;