
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BrainReflexPoint } from "@/data/brain-reflex-data";
import { 
  Brain, 
  Zap, 
  Info, 
  Target, 
  Sparkles, 
  Activity, 
  Layers,
  MapPin,
  MousePointer2,
  ShieldAlert,
  Hand,
  PlayCircle,
  AlertCircle,
  ListChecks,
  CheckCircle2,
  ArrowRight,
  ImageIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BrainReflexModalProps {
  point: BrainReflexPoint | null;
  primaryUrl: string | null;
  secondaryUrl: string | null;
  tertiaryUrl?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BrainReflexModal = ({ 
  point, 
  primaryUrl, 
  secondaryUrl, 
  tertiaryUrl,
  open, 
  onOpenChange 
}: BrainReflexModalProps) => {
  if (!point) return null;

  const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
    <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-3", color)}>
      <Icon size={14} /> {title}
    </h4>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] rounded-[3rem] overflow-hidden p-0 border-none shadow-2xl">
        <DialogHeader className="p-0">
          <div className={cn(
            "p-10 text-white transition-colors relative",
            point.category === 'Cortical' ? "bg-purple-600" :
            point.category === 'Subcortical' ? "bg-indigo-600" :
            "bg-emerald-600"
          )}>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center shadow-xl">
                {point.category === 'Cortical' ? <Brain size={40} /> : 
                 point.category === 'Subcortical' ? <Layers size={40} /> : 
                 <Zap size={40} />}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase tracking-widest">
                    {point.category}
                  </Badge>
                  <Badge variant="outline" className="border-white/40 text-white font-black text-[10px] uppercase tracking-widest">
                    {point.lateralization} Logic
                  </Badge>
                </div>
                <DialogTitle className="text-4xl font-black tracking-tight">{point.name}</DialogTitle>
                <DialogDescription className="text-white/80 font-medium text-lg">
                  Neurological Assessment Protocol
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-10 space-y-12 overflow-y-auto max-h-[calc(95vh-180px)]">
          {/* Assessment Protocol - Highlighted */}
          {point.assessmentProtocol && (
            <section className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><ListChecks size={100} /></div>
              <SectionHeader icon={ListChecks} title="Assessment Protocol" color="text-indigo-600" />
              <p className="text-xl font-black text-indigo-900 leading-tight relative z-10">
                {point.assessmentProtocol}
              </p>
            </section>
          )}

          {/* Delineated Reflex vs Stimulus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Hand size={100} /></div>
              <SectionHeader icon={Hand} title="Reflex Point (Touch)" color="text-slate-600" />
              <p className="text-lg font-bold text-slate-900 leading-tight relative z-10">
                {point.location}
              </p>
            </div>

            <div className="p-8 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><PlayCircle size={100} /></div>
              <SectionHeader icon={PlayCircle} title="Stimulus (Action)" color="text-amber-600" />
              <p className="text-lg font-bold text-amber-900 leading-tight relative z-10">
                {point.stimulus || point.technique || ""}
              </p>
            </div>
          </div>

          {/* Image Showcase - Three in a row */}
          <section className="space-y-4">
            <SectionHeader icon={ImageIcon} title="Visual References" color="text-slate-600" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="aspect-video rounded-[2rem] bg-slate-50 border-2 border-slate-100 overflow-hidden flex items-center justify-center group relative shadow-inner">
                {primaryUrl ? (
                  <img src={primaryUrl} alt="Primary" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="text-center p-4">
                    <Brain size={32} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">No Primary Image</p>
                  </div>
                )}
              </div>

              <div className="aspect-video rounded-[2rem] bg-slate-50 border-2 border-slate-100 overflow-hidden flex items-center justify-center group relative shadow-inner">
                {secondaryUrl ? (
                  <img src={secondaryUrl} alt="Secondary" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="text-center p-4">
                    <Target size={32} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">No Secondary Image</p>
                  </div>
                )}
              </div>

              <div className="aspect-video rounded-[2rem] bg-slate-50 border-2 border-slate-100 overflow-hidden flex items-center justify-center group relative shadow-inner">
                {tertiaryUrl ? (
                  <img src={tertiaryUrl} alt="Tertiary" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="text-center p-4">
                    <Zap size={32} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">No Tertiary Image</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Functions & Dysfunction Signs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {point.functions && (
              <section className="space-y-4">
                <SectionHeader icon={Activity} title="Key Functions" color="text-emerald-600" />
                <ul className="space-y-3">
                  {point.functions.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {point.dysfunctionSigns && (
              <section className="space-y-4">
                <SectionHeader icon={AlertCircle} title="Dysfunction Signs" color="text-rose-600" />
                <ul className="space-y-3">
                  {point.dysfunctionSigns.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                      <ArrowRight size={18} className="text-rose-500 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Clinical Pearl */}
          {point.pearl && (
            <section>
              <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Sparkles size={80} /></div>
                <SectionHeader icon={Sparkles} title="Clinical Pearl" color="text-purple-400" />
                <p className="text-lg font-medium leading-relaxed relative z-10">
                  "{point.pearl}"
                </p>
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BrainReflexModal;