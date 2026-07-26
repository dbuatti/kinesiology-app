import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Sparkles, AlertCircle, ArrowRight, Info, MessageSquare, Target, ShieldAlert } from "lucide-react";

const LimitingBeliefsBackground = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Psychology of Suffering */}
      <section>
        <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
          <Brain className="text-primary" />
          Psychology of Suffering
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-secondary/20 border-none shadow-none hover:bg-secondary/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Moving Towards vs. Away
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Most suffering stems from trying to move "away" from a feeling rather than "towards" a goal. When we resist a feeling, we create a "not-me" identity that we must constantly defend or escape from.
            </CardContent>
          </Card>

          <Card className="bg-secondary/20 border-none shadow-none hover:bg-secondary/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                Inability to Sit in Feelings
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Suffering is the result of the nervous system's inability to process a specific felt sense. We create beliefs to explain why we feel this way, which then become the "truth" of our reality.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Wants vs. Needs */}
      <section>
        <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
          <Sparkles className="text-primary" />
          Wants vs. Needs
        </h2>
        <div className="overflow-hidden rounded-xl border border-secondary/30 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/20">
                <th className="p-4 font-bold border-b border-secondary/30">Client Wants (Conscious)</th>
                <th className="p-4 font-bold border-b border-secondary/30">Nervous System Goals (Unconscious)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/30">
              <tr>
                <td className="p-4 text-sm">To be happy and successful</td>
                <td className="p-4 text-sm">To maintain safety and predictability</td>
              </tr>
              <tr>
                <td className="p-4 text-sm">To get rid of the pain</td>
                <td className="p-4 text-sm">To keep the pain as a protective signal</td>
              </tr>
              <tr>
                <td className="p-4 text-sm">To change their life</td>
                <td className="p-4 text-sm">To preserve the current identity (even if it hurts)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Mechanics of Suffering */}
      <section>
        <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
          <Info className="text-primary" />
          Mechanics of Suffering
        </h2>
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center text-center max-w-[150px]">
              <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-sm mb-2">
                <AlertCircle className="text-amber-500" />
              </div>
              <span className="text-xs font-bold">Stimulus</span>
              <p className="text-[10px] text-muted-foreground">External event or internal thought</p>
            </div>
            <ArrowRight className="hidden md:block text-muted-foreground/30" />
            <div className="flex flex-col items-center text-center max-w-[150px]">
              <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-sm mb-2">
                <Brain className="text-rose-500" />
              </div>
              <span className="text-xs font-bold">Felt Sense</span>
              <p className="text-[10px] text-muted-foreground">Raw physical sensation in the body</p>
            </div>
            <ArrowRight className="hidden md:block text-muted-foreground/30" />
            <div className="flex flex-col items-center text-center max-w-[150px]">
              <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-sm mb-2">
                <MessageSquare className="text-indigo-500" />
              </div>
              <span className="text-xs font-bold">Belief Extraction</span>
              <p className="text-[10px] text-muted-foreground">Mind creates a story to explain the feeling</p>
            </div>
            <ArrowRight className="hidden md:block text-muted-foreground/30" />
            <div className="flex flex-col items-center text-center max-w-[150px]">
              <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-sm mb-2">
                <ShieldAlert className="text-primary" />
              </div>
              <span className="text-xs font-bold">Overwhelm</span>
              <p className="text-[10px] text-muted-foreground">Identity becomes fused with the belief</p>
            </div>
          </div>
        </div>
      </section>

      {/* Language Patterns */}
      <section>
        <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
          <MessageSquare className="text-primary" />
          Language Patterns
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Identity Statements", pattern: "I am...", example: "I am not good enough", color: "bg-primary/5 text-primary border-primary/20" },
            { title: "Generalizations", pattern: "People will...", example: "People will always let me down", color: "bg-purple-50 text-purple-700 border-purple-100" },
            { title: "Causality", pattern: "If I... then...", example: "If I succeed, I'll be alone", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
            { title: "Necessity", pattern: "I must / I can't...", example: "I can't show any weakness", color: "bg-amber-50 text-amber-700 border-amber-100" },
            { title: "Possibility", pattern: "It's impossible to...", example: "It's impossible to be truly happy", color: "bg-rose-50 text-rose-700 border-rose-100" },
            { title: "External Control", pattern: "They make me...", example: "They make me feel worthless", color: "bg-indigo-50 text-indigo-700 border-indigo-100" }
          ].map((item, i) => (
            <div key={i} className={`p-4 rounded-xl border ${item.color}`}>
              <h3 className="font-bold text-sm mb-1">{item.title}</h3>
              <div className="text-xs opacity-80 mb-2 font-mono">{item.pattern}</div>
              <p className="text-xs italic">"{item.example}"</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LimitingBeliefsBackground;