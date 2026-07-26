
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Shield,
  Layers,
  Zap,
  Info,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lightbulb,
  ShieldAlert,
  Activity,
  Brain,
  Eye,
  Crown,
  RefreshCw,
  Printer,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const HeartWallBible = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Hero Section */}
      <Card className="border-none shadow-2xl rounded-[3.5rem] bg-foreground text-primary-foreground overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5"><Heart size={200} /></div>
        <CardHeader className="p-12 relative z-10">
          <div className="flex items-center gap-5 mb-4">
            <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-500/40">
              <Heart size={32} className="text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-4xl font-black tracking-tight">The Heart Wall Bible</CardTitle>
              <CardDescription className="text-muted-foreground text-xl font-medium mt-2">
                Understanding the subconscious architecture of emotional protection.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button asChild variant="secondary" className="rounded-xl bg-card/10 text-primary-foreground border-primary-foreground/20 hover:bg-card/20">
              <Link to="/practice/procedures"><Zap size={16} className="mr-2" /> View Protocol</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-xl bg-card/10 text-primary-foreground border-primary-foreground/20 hover:bg-card/20">
              <Link to="/resources/heart-wall/print"><Printer size={16} className="mr-2" /> Print Sheet</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-xl bg-card/10 text-primary-foreground border-primary-foreground/20 hover:bg-card/20">
              <Link to="/resources/print"><FileText size={16} className="mr-2" /> Print Hub</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Core Concept */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
          <CardHeader className="bg-rose-50 p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-rose-900">
              <Shield size={24} /> What is a Heart Wall?
            </CardTitle>
            <CardDescription className="text-rose-700 font-medium">The subconscious shield.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              A Heart Wall is a metaphorical barrier created by the subconscious mind using the energy of trapped emotions. Its primary purpose is to protect the heart from emotional pain, grief, or perceived threat.
            </p>
            <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
              <h4 className="font-black text-foreground uppercase tracking-widest text-[10px] mb-2">The Trade-off</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                While the wall provides safety during trauma, it also acts as a filter that numbs positive emotions, blocks connection with others, and creates a sense of isolation.
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <h4 className="font-black text-indigo-900 uppercase tracking-widest text-[10px] mb-2">Ancient Parallel</h4>
              <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                The Pericardium meridian in Chinese medicine is often seen as the "heart protector" —
                the same concept as the Heart Wall, described thousands of years ago.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
          <CardHeader className="bg-indigo-50 p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900">
              <Layers size={24} /> Priority Primary Approach
            </CardTitle>
            <CardDescription className="text-indigo-700 font-medium">Work smarter, not harder.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Instead of clearing all 25+ layers one by one, ask the body for the <strong className="text-indigo-800">priority primary</strong> layer —
              the highest-impact layer in the stack. One correction on the priority primary can clear <strong className="text-indigo-800">5 to 10 layers</strong> at once.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { m: "25 Layers", d: "One-at-a-time approach → 25 corrections, multiple sessions." },
                { m: "Priority Primary", d: "5–10 corrections targeting the highest layers only." },
              ].map(item => (
                <div key={item.m} className="p-3 bg-muted/50 rounded-xl border border-border/50">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{item.m}</p>
                  <p className="text-xs font-medium text-muted-foreground">{item.d}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* The Emperor Quote */}
      <div className="p-8 bg-indigo-900 rounded-[2.5rem] shadow-lg text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Crown size={160} /></div>
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <Heart size={40} className="text-rose-400 mx-auto" />
          <p className="text-2xl font-bold italic leading-relaxed">
            "As the heart perceives, the brain receives, the gut produces the feeling, and the mind thinks about it.
          </p>
          <p className="text-2xl font-bold italic leading-relaxed">
            The heart is the governor. The heart is the emperor. It holds the keys to the brain.
          </p>
          <p className="text-2xl font-bold italic leading-relaxed">
            The brain holds the keys to the gut, and vice versa."
          </p>
          <p className="text-sm text-indigo-300 font-medium mt-4">— Heart Wall Lecture, Resonance Kinesiology</p>
        </div>
      </div>

      {/* Clinical Significance */}
      <div className="space-y-8">
        <h3 className="text-2xl font-black text-foreground px-2 flex items-center gap-3">
          <Activity size={28} className="text-rose-600" /> Clinical Significance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Physical Impact",
              icon: Zap,
              color: "text-amber-500",
              desc: "Chronic neck and shoulder tension, chest tightness, and respiratory shallowing are common physical markers of a Heart Wall."
            },
            {
              title: "Emotional Impact",
              icon: Heart,
              color: "text-rose-500",
              desc: "Difficulty feeling joy, a sense of 'numbness', or repeating patterns of isolation in relationships."
            },
            {
              title: "Spiritual Impact",
              icon: Sparkles,
              color: "text-indigo-500",
              desc: "A block in the ability to give and receive love freely, and a disconnect from one's core purpose."
            }
          ].map((item, i) => (
            <Card key={i} className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden group hover:shadow-xl transition-all">
              <CardContent className="p-8 space-y-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform bg-muted/50", item.color)}>
                  <item.icon size={24} />
                </div>
                <h4 className="font-black text-foreground text-lg">{item.title}</h4>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* When to Check */}
      <div className="p-8 bg-rose-50 rounded-[2.5rem] border-2 border-rose-100 space-y-4">
        <h3 className="text-xl font-black text-rose-900 flex items-center gap-3">
          <RefreshCw size={22} className="text-rose-600" /> When to Check the Heart Wall
        </h3>
        <p className="text-lg font-bold text-rose-800 italic leading-relaxed">
          The question isn't when — it's <span className="underline decoration-rose-400/30 underline-offset-4">when do you not check?</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {[
            { t: "New Clients", d: "One of the top things to work through — same priority as primitive reflexes and cranial nerves." },
            { t: "Returning Clients", d: "Screen every session. Hidden layers may have surfaced since the last visit." },
            { t: "Self-Practice", d: "Work through your own Heart Wall. Practitioners report a huge difference in how they feel." },
          ].map(item => (
            <div key={item.t} className="p-4 bg-card rounded-2xl border border-rose-200">
              <p className="font-black text-sm text-rose-700">{item.t}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden Heart Wall */}
      <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 space-y-4">
        <h3 className="text-xl font-black text-indigo-900 flex items-center gap-3">
          <Eye size={22} className="text-indigo-600" /> The Hidden Heart Wall
        </h3>
        <p className="text-sm text-indigo-800 font-medium leading-relaxed">
          After the main Heart Wall is cleared, a <strong>hidden Heart Wall</strong> may surface after a few days or weeks.
          It will usually have fewer layers than the original, but it must be cleared to fully open the heart.
        </p>
        <div className="p-4 bg-card rounded-2xl border border-indigo-200">
          <p className="text-xs font-medium text-indigo-700 leading-relaxed">
            <strong>Clinical Note:</strong> At the time of recording the Heart Wall lecture,
            the practitioner still had one layer of the hidden Heart Wall remaining,
            saved for a future demonstration. Even one layer affects how you feel.
          </p>
        </div>
      </div>

      {/* Symbolic Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
          <CardHeader className="bg-amber-50 p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-amber-900">
              <ShieldAlert size={24} /> Symbolic Materials
            </CardTitle>
            <CardDescription className="text-amber-700 font-medium">The language of the subconscious.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              The subconscious often assigns a material to the wall. This material provides insight into the nature of the protection:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { m: "Wood", d: "Flexible but sturdy." },
                { m: "Stone", d: "Heavy, ancient, rigid." },
                { m: "Metal", d: "Cold, impenetrable." },
                { m: "Glass", d: "Fragile, transparent." }
              ].map(item => (
                <div key={item.m} className="p-3 bg-muted/50 rounded-xl border border-border/50">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">{item.m}</p>
                  <p className="text-xs font-medium text-muted-foreground">{item.d}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
          <CardHeader className="bg-emerald-50 p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-emerald-900">
              <CheckCircle2 size={24} /> After the Wall Clears
            </CardTitle>
            <CardDescription className="text-emerald-700 font-medium">What shifts when the barrier drops.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Once the Heart Wall is cleared, many things open up:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                "Emotions flow more freely",
                "Feelings return",
                "You feel lighter",
                "Relationships improve",
                "Money starts to flow",
                "New opportunities arise",
                "Connection with others deepens",
                "A sense of ease in life"
              ].map(item => (
                <div key={item} className="flex items-center gap-2 p-2">
                  <ArrowRight size={12} className="text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">It's not perfect</p>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Clearing the Heart Wall doesn't make life perfect, but it's a great load off the system.
                You can definitely feel it as it happens.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Nav */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button asChild variant="outline" className="rounded-2xl h-14 px-8 border-2">
          <Link to="/practice/procedures"><Zap size={18} className="mr-2" /> Heart Wall Protocol</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-2xl h-14 px-8 border-2">
          <Link to="/resources/heart-wall/print"><Printer size={18} className="mr-2" /> Print Reference Sheet</Link>
        </Button>
      </div>

      {/* Pro Tip */}
      <div className="p-8 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100 flex items-start gap-6 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-primary-foreground flex items-center justify-center shadow-xl shrink-0">
          <Lightbulb size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-black text-amber-900">Practitioner Pro-Tip</h4>
          <p className="text-amber-800 font-medium leading-relaxed">
            Clearing a Heart Wall is often a multi-session process. The subconscious will only allow the release of emotions that the system is ready to process. If the body says 'No' to releasing more, honor that boundary. The wall was built for a reason — it must be dismantled with respect.
          </p>
          <div className="mt-4 p-4 bg-card rounded-2xl border border-amber-200">
            <p className="text-xs font-medium text-amber-900 leading-relaxed">
              <strong>Online/Remote:</strong> The Heart Wall procedure can be done remotely.
              When you have the direct feedback of muscle testing in the clinic, it's even more powerful.
              The sense of something "leaving" or "a wave coming up" is common in both settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeartWallBible;
