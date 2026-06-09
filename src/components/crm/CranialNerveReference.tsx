
import React, { useState } from "react";
import { CRANIAL_NERVES, BRAINSTEM_KEYS, BrainstemNuclei } from "@/data/cranial-nerve-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Zap, 
  Activity, 
  Info, 
  ShieldAlert,
  Hand,
  PlayCircle,
  Layers,
  Workflow,
  Sparkles,
  ArrowRightLeft,
  Printer,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const CranialNerveReference = () => {
  const [search, setSearch] = useState("");
  const [selectedNuclei, setSelectedNuclei] = useState<BrainstemNuclei | 'All'>('All');

  const filteredNerves = CRANIAL_NERVES.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(search.toLowerCase()) || 
                         n.latinName.toLowerCase().includes(search.toLowerCase()) ||
                         n.stimulus.toLowerCase().includes(search.toLowerCase());
    const matchesNuclei = selectedNuclei === 'All' || n.nuclei === selectedNuclei;
    return matchesSearch && matchesNuclei;
  });

  const nucleiOptions: (BrainstemNuclei | 'All')[] = ['All', 'Cortex', 'Midbrain', 'Pons', 'Medulla'];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Brainstem Housing Key */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {Object.entries(BRAINSTEM_KEYS).map(([key, data]) => (
          <Card key={key} className={cn(
            "border-none shadow-md rounded-3xl overflow-hidden transition-all",
            key === 'Cortex' ? "bg-muted border-border" :
            key === 'Midbrain' ? "bg-muted border-border" :
            key === 'Pons' ? "bg-muted border-border" :
            "bg-muted border-border"
          )}>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm uppercase tracking-wider">{key}</h4>
                <Badge variant="outline" className="text-[10px] font-medium border-current/20">Housing</Badge>
              </div>
              <p className="text-[10px] font-medium leading-relaxed opacity-80">{data.description}</p>
              <div className="pt-2 flex items-center gap-2">
                <Zap size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Stim: {data.stim}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search nerves, functions, stims..." 
            className="pl-12 bg-white border-border rounded-xl h-14 shadow-sm font-medium focus:ring-2 focus:ring-chart-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {nucleiOptions.map(opt => (
            <Button 
              key={opt}
              variant={selectedNuclei === opt ? "default" : "outline"}
              onClick={() => setSelectedNuclei(opt)}
              className={cn(
                "rounded-xl h-14 px-6 font-medium text-[10px] uppercase tracking-wider whitespace-nowrap transition-all",
                selectedNuclei === opt ? "bg-slate-900 shadow-sm" : "border-border bg-white hover:bg-muted"
              )}
            >
              {opt}
            </Button>
          ))}
          <div className="flex gap-2 border-l border-border pl-2">
            <Button 
              variant="outline" 
              asChild
              className="rounded-xl h-14 px-6 font-medium text-[10px] uppercase tracking-wider border-border text-chart-primary hover:bg-muted"
            >
              <Link to="/resources/cranial-nerves/print">
                <Printer size={18} className="mr-2" /> Reference
              </Link>
            </Button>
            <Button 
              variant="outline" 
              asChild
              className="rounded-xl h-14 px-6 font-medium text-[10px] uppercase tracking-wider border-border text-chart-destructive hover:bg-muted"
            >
              <Link to="/resources/cranial-nerves/worksheet">
                <FileText size={18} className="mr-2" /> Worksheet
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredNerves.map(nerve => {
          return (
            <Card key={nerve.id} className="border-none shadow-sm rounded-xl bg-white hover:shadow-2xl transition-all group overflow-hidden">
              <CardHeader className={cn(
                "pb-6 border-b transition-colors relative",
                nerve.nuclei === 'Cortex' ? "bg-muted/50 border-border" :
                nerve.nuclei === 'Midbrain' ? "bg-muted/50 border-border" :
                nerve.nuclei === 'Pons' ? "bg-muted/50 border-border" :
                "bg-muted/50 border-border"
              )}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex gap-2 mb-2">
                      <Badge className={cn(
                        "border-none font-medium text-[10px] uppercase tracking-wider",
                        nerve.nuclei === 'Cortex' ? "bg-chart-primary/10 text-chart-primary" :
                        nerve.nuclei === 'Midbrain' ? "bg-muted text-muted-foreground" :
                        nerve.nuclei === 'Pons' ? "bg-chart-primary/10 text-chart-primary" :
                        "bg-chart-destructive/10 text-chart-destructive"
                      )}>
                        {nerve.nuclei}
                      </Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground font-medium text-[10px] uppercase tracking-wider">
                        {nerve.toneEffect} Tone
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-semibold text-foreground group-hover:text-chart-primary transition-colors">
                      {nerve.name}: {nerve.latinName}
                    </CardTitle>
                    {nerve.acupoint && (
                      <p className="text-[10px] font-medium text-chart-primary uppercase tracking-wider">{nerve.acupoint}</p>
                    )}
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-white",
                    nerve.color
                  )}>
                    <Zap size={24} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-muted rounded-xl border border-border">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Hand size={12} /> Touch Point
                    </p>
                    <p className="text-sm font-medium text-foreground leading-relaxed">{nerve.reflexPoint}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl border border-border">
                    <p className="text-[10px] font-medium text-chart-primary uppercase tracking-wider mb-1 flex items-center gap-1">
                      <PlayCircle size={12} /> Stim Protocol
                    </p>
                    <p className="text-sm font-medium text-foreground leading-relaxed">{nerve.stimulus}</p>
                  </div>
                </div>

                {nerve.delineationGuide && (
                  <div className="p-5 bg-muted/50 rounded-3xl border-2 border-border animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRightLeft size={16} className="text-chart-primary" />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-chart-primary">Delineation Guide</span>
                    </div>
                    <p className="text-xs font-medium text-foreground leading-relaxed">
                      {nerve.delineationGuide}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Key Functions</p>
                  <div className="space-y-1.5">
                    {nerve.functions.map(f => (
                      <div key={f} className="flex items-start gap-2 text-xs font-medium text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-chart-primary mt-1.5 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-muted rounded-3xl border border-border relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={40} className="text-muted-foreground" /></div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Info size={14} /> Clinical Pearl
                  </p>
                  <p className="text-xs text-foreground font-medium leading-relaxed">
                    {nerve.clinicalPearl}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-none shadow-sm rounded-xl bg-slate-900 text-white overflow-hidden">
        <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-2xl shadow-chart-primary/40">
            <Workflow size={48} className="text-white" />
          </div>
          <div className="space-y-4">
            <h4 className="text-2xl font-semibold flex items-center gap-3">
              <ShieldAlert size={24} className="text-chart-primary" /> Pathway Assessment Logic
            </h4>
            <p className="text-muted-foreground font-medium leading-relaxed text-lg">
              "When a CN reflex point test produces an Indicator Response, determine the direction of treatment: **Afferent** (mechano-vestibular, nociceptive, physiology) or **Efferent** (cortical, sub-cortical, emotions). No response = pathway normal."
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-chart-primary" />
                <span className="text-xs font-medium text-slate-300">Pons = Extensors (CN 5-8)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-chart-destructive" />
                <span className="text-xs font-medium text-slate-300">Medulla = Flexors (CN 9-12)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted" />
                <span className="text-xs font-medium text-slate-300">Midbrain = Flexors (CN 3-4)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CranialNerveReference;