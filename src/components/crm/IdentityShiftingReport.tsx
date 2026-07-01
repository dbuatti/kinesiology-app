
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Zap, 
  Heart, 
  Activity, 
  Fingerprint, 
  RotateCcw, 
  Sparkles, 
  ArrowLeft,
  Calendar,
  Quote
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IdentityShiftingReportProps {
  session: any;
  onBack: () => void;
}

const IdentityShiftingReport = ({ session, onBack }: IdentityShiftingReportProps) => {
  const loopQuestions = [
    "What is it?",
    "Where did it come from?",
    "What is it made of?",
    "What is it trying to do?",
    "What is it now?",
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="rounded-xl text-slate-500">
          <ArrowLeft size={18} className="mr-2" /> Back to History
        </Button>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <Calendar size={14} />
          {new Date(session.created_at).toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
            <Fingerprint size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">Session Report</h2>
            <p className="text-slate-500 font-medium">The evolution of "{session.identity}"</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: The Setup */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-md rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" /> The Challenge
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Problem</p>
                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                  {session.problem}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-50">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">
                    <Heart size={10} /> Primary Emotion
                  </p>
                  <p className="text-sm font-bold text-slate-700">{session.emotion || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    <Activity size={10} /> Felt Sense
                  </p>
                  <p className="text-sm font-bold text-slate-700">{session.felt_sense || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[2rem] bg-indigo-900 text-white overflow-hidden">
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">The Identity</p>
              <h3 className="text-3xl font-serif font-bold italic">"{session.identity}"</h3>
              <div className="w-12 h-1 bg-indigo-500/30 mx-auto rounded-full" />
              <p className="text-xs text-indigo-200 font-medium leading-relaxed">
                This was the version of self that was holding the problem in place.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: The Process & Integration */}
        <div className="lg:col-span-2 space-y-8">
          {/* The Dissolving Loop */}
          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 px-2 flex items-center gap-3">
              <RotateCcw size={20} className="text-indigo-600" /> The Dissolving Loop
            </h3>
            <div className="space-y-3">
              {session.loop_responses?.map((response: string, index: number) => (
                <div key={index} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0">
                      {index + 1}
                    </div>
                    {index < session.loop_responses.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-100 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {loopQuestions[index % 5]}
                    </p>
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:border-indigo-200 transition-colors">
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">
                        {response}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Final Integration */}
          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 px-2 flex items-center gap-3">
              <Sparkles size={20} className="text-emerald-600" /> Integration & Shift
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-md rounded-[2rem] bg-emerald-50 border-2 border-emerald-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">New Awareness</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-bold text-emerald-900 leading-relaxed">
                    {session.integration_awareness || 'No awareness recorded.'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md rounded-[2rem] bg-indigo-50 border-2 border-indigo-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Integration Action</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                    {session.integration_action || 'No action recorded.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] flex items-start gap-6 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
              <Quote size={24} className="text-indigo-300" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest">Clinical Reflection</h4>
              <p className="text-slate-300 text-sm font-medium leading-relaxed italic">
                "The shift occurs when the 'I' that has the problem is seen as a construct. By tracing the identity back to its source, we return to the neutral observer."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityShiftingReport;