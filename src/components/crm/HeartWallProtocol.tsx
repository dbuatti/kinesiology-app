
import React, { useState } from 'react';
import { 
  Heart, 
  Zap, 
  Search,
  Activity,
  Dumbbell,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Info,
  BookOpen,
  FileText,
  Lightbulb,
  Hand,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EMOTION_CODE_CHART, ROW_DATA } from '@/data/emotion-code-data';
import { Link } from 'react-router-dom';

const ASSESSMENT_STEPS = [
  { id: 1, title: "Permission to Assess", desc: "Ask the body: 'Do we have permission to assess the Heart Wall?'" },
  { id: 2, title: "Find Emotion", desc: "Use the Emotion Chart and Pulse Points (PP) to identify the specific trapped emotion." },
  { id: 3, title: "Assess Related Muscles", desc: "Verify the finding by testing the muscles associated with the identified organ/row." },
  { id: 4, title: "Find Efferent Coordinates", desc: "Identify the specific brain zones (Cortical or Subcortical) associated with this pattern." },
  { id: 5, title: "Gather Context (CH)", desc: "Identify the Age it happened, the associated Event, and if it is Inherited." }
];

const CORRECTION_STEPS = [
  { id: 1, title: "Permission to Correct", desc: "Confirm the system is ready to release this specific layer." },
  { id: 2, title: "Stim Heart Referral Zone", desc: "Stimulate the Heart Visceral Referral Zone (Chest, Shoulder, or Medial Arm)." },
  { id: 3, title: "Hold Organ Point/Muscle", desc: "Simultaneously hold the Organ Pulse Point or the associated muscle." },
  { id: 4, title: "Tap Efferent Zones", desc: "Tap the identified brain zones while intending the release. (3 swipes, or 10 if inherited)." }
];

const HeartWallProtocol = () => {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const SectionTitle = ({ children, icon: Icon, color }: any) => (
    <div className="flex items-center gap-4 border-b border-border pb-2 mb-4 mt-8 first:mt-0">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground shadow-sm", color)}>
        <Icon size={16} />
      </div>
      <h2 className="text-2xl font-medium text-foreground">{children}</h2>
    </div>
  );

  return (
    <div 
      className="w-full py-2 px-2 animate-in fade-in duration-700 pb-20"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="space-y-2">
          <Badge className="bg-chart-destructive/10 text-chart-destructive border-none font-semibold text-[10px] uppercase tracking-wider px-4 py-1 rounded-full">
            Clinical Reference
          </Badge>
          <h1 className="text-4xl font-medium text-foreground tracking-tight">Heart Wall Protocol</h1>
          <p className="text-lg text-muted-foreground">Subconscious Barrier Release Process</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl h-12 px-6 font-medium border-chart-destructive/20 text-chart-destructive hover:bg-muted">
          <Link to="/resources/heart-wall/print">
            <Printer size={18} className="mr-2" /> Print Reference Sheet
          </Link>
        </Button>
      </div>

      {/* 1. Assessment Flow */}
      <section>
        <SectionTitle icon={Search} color="bg-primary">Assessment Summary</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            {ASSESSMENT_STEPS.map((step) => (
              <div key={step.id} className="flex gap-4 group">
                <span className="text-xl font-semibold text-chart-primary/40 group-hover:text-chart-primary transition-colors tabular-nums">
                  0{step.id}
                </span>
                <div className="space-y-0.5">
                  <h4 className="text-lg font-medium text-foreground">{step.title}</h4>
                  <p className="text-base text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-5">
            <div className="p-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Hand size={14} className="text-chart-primary" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pulse Point Reference</span>
              </div>
              <img 
                src="/images/pulse-points.png" 
                alt="Pulse Points Reference" 
                className="w-full h-auto rounded-xl"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Master Chart */}
      <section className="mt-12">
        <SectionTitle icon={Heart} color="bg-rose-600">The Emotion & Muscle Chart</SectionTitle>
        
        <div className="overflow-hidden rounded-xl border border-border shadow-sm bg-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-card text-card-foreground">
                <th className="p-4 text-left uppercase tracking-wider text-[10px] border-r border-border w-1/4">Organ</th>
                <th className="p-4 text-left uppercase tracking-wider text-[10px] border-r border-border w-1/2">Emotions</th>
                <th className="p-4 text-left uppercase tracking-wider text-[10px] w-1/4">Muscles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[1, 2, 3, 4, 5, 6].map((rowNum) => (
                <tr 
                  key={rowNum} 
                  className={cn(
                    "transition-all cursor-pointer hover:bg-muted",
                    selectedRow === rowNum ? "bg-muted ring-2 ring-inset ring-chart-primary" : ""
                  )}
                  onClick={() => setSelectedRow(selectedRow === rowNum ? null : rowNum)}
                >
                  <td className="p-4 border-r border-border align-top">
                    <p className="font-medium text-chart-primary text-base leading-tight">
                      {ROW_DATA[rowNum].organ}
                    </p>
                  </td>
                  <td className="p-4 border-r border-border align-top">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {[...EMOTION_CODE_CHART[rowNum].columnA, ...EMOTION_CODE_CHART[rowNum].columnB].map(e => (
                        <div key={e} className="text-foreground font-medium text-sm">{e}</div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="space-y-2">
                      {ROW_DATA[rowNum].muscles.split('; ').map((group, i) => {
                        const [organ, list] = group.split(': ');
                        return (
                          <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground">{organ}:</span> {list}
                          </p>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedRow && (
          <div className="mt-4 p-6 bg-card text-card-foreground rounded-xl shadow-sm animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={80} /></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold text-chart-primary uppercase tracking-wider">Active Focus</p>
                <h4 className="text-2xl font-medium">{ROW_DATA[selectedRow].organ}</h4>
              </div>
              <button onClick={() => setSelectedRow(null)} className="text-chart-primary/60 hover:text-card-foreground h-8 flex items-center gap-2">
                <RefreshCw size={14} /> Clear
              </button>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-3">
                <Dumbbell size={16} className="text-chart-primary shrink-0 mt-1" />
                <div className="text-base font-medium text-muted-foreground leading-relaxed">
                  <p className="mb-2">Test these muscles to verify the finding:</p>
                  <div className="space-y-1">
                    {ROW_DATA[selectedRow].muscles.split('; ').map((group, i) => {
                      const [organ, list] = group.split(': ');
                      return (
                        <div key={i}>
                          <span className="font-semibold text-card-foreground">{organ}:</span> {list}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Correction Flow */}
      <section className="mt-12">
        <SectionTitle icon={Zap} color="bg-primary">Correction Summary</SectionTitle>
        <div className="space-y-6">
          {CORRECTION_STEPS.map((step) => (
            <div key={step.id} className="flex gap-4 group">
              <span className="text-xl font-semibold text-chart-emerald/40 group-hover:text-chart-emerald transition-colors tabular-nums">
                0{step.id}
              </span>
              <div className="space-y-0.5">
                <h4 className="text-lg font-medium text-foreground">{step.title}</h4>
                <p className="text-base text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Visceral Referral */}
      <section className="mt-12">
        <SectionTitle icon={Activity} color="bg-destructive">Visceral Referral Zone</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="aspect-video rounded-xl overflow-hidden bg-muted border border-border shadow-inner flex items-center justify-center p-4">
            <img 
              src="/images/heart-referral.png" 
              alt="Heart Visceral Referral Zones" 
              className="max-w-full h-auto rounded-lg"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="p-6 bg-muted rounded-xl border border-border space-y-4">
            <h4 className="text-[10px] font-semibold text-chart-destructive uppercase tracking-wider">Primary Referral Areas</h4>
            <ul className="space-y-2 text-base font-medium text-foreground">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-chart-destructive" /> Left Chest / Precordium</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-chart-destructive" /> Left Shoulder & Upper Back</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-chart-destructive" /> Medial aspect of Left Arm</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-chart-destructive" /> Jaw / Neck (occasionally)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Client Education */}
      <section className="mt-12">
        <SectionTitle icon={BookOpen} color="bg-primary">Client Education</SectionTitle>
        <div className="p-8 bg-muted rounded-xl border border-border space-y-6">
          <p className="text-lg font-medium text-foreground leading-relaxed">
            "A Heart-Wall is made of one or more trapped emotions that the subconscious mind uses to surround the heart as a protective barrier against emotional pain."
          </p>
          <div className="space-y-3">
            {[
              "Each trapped emotion in the Heart-Wall is known as a Heart-Wall emotion.",
              "A Heart-Wall emotion is one layer in the collective Heart-Wall. When all Heart-Wall emotions have been removed, the Heart-Wall is gone.",
              "The Heart-Wall is usually created in response to emotional distress. The subconscious mind then uses pre-existing trapped emotions to form the wall.",
              "Heart-Wall emotions may be from any time in your own life and they can also be inherited.",
              "Most individuals have a Heart-Wall consisting of between five and 25 Heart-Wall emotions.",
              "A Heart-Wall may cause you to feel disconnected from others, lonely, sad, anxious, and unmotivated.",
              "Physical symptoms such as neck and shoulder discomfort may be present."
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-chart-primary mt-2 shrink-0" />
                <p className="text-sm text-foreground font-medium leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinical Note */}
      <div className="mt-12 p-8 bg-card text-card-foreground rounded-xl flex items-start gap-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Info size={100} /></div>
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0 relative z-10">
          <Lightbulb size={24} />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-semibold text-chart-primary uppercase tracking-wider">Clinical Mastery Note</p>
          <p className="text-base text-muted-foreground/60 font-medium leading-relaxed">
            "The shift occurs when the client can distinguish between the 'me' (the observer) and the 'not-me' (the identity/emotion). Dismantle the wall with respect—it was built for a reason."
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeartWallProtocol;