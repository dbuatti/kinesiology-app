import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Shield, Activity, Zap, Info, CheckCircle2, XCircle, Layers } from "lucide-react";

const IdentityAlignmentBackground = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Neuroscience Section */}
      <section>
        <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
          <Brain className="text-primary" />
          The Neuroscience of Identity Alignment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-secondary/20 border-none shadow-none hover:bg-secondary/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Prefrontal Cortex (PFC)</CardTitle>
              <CardDescription>Predictive Modeling</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              The PFC is responsible for maintaining our "predictive model" of the world and ourselves. Identity Alignment works by updating these high-level models to reflect a more integrated and safe reality.
            </CardContent>
          </Card>

          <Card className="bg-secondary/20 border-none shadow-none hover:bg-secondary/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Insula</CardTitle>
              <CardDescription>Interoceptive Awareness</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              The Insula processes internal bodily sensations (interoception). By mapping somatic states during the protocol, we bridge the gap between cognitive identity and physical experience.
            </CardContent>
          </Card>

          <Card className="bg-secondary/20 border-none shadow-none hover:bg-secondary/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Vagus Nerve</CardTitle>
              <CardDescription>Autonomic Safety</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              The Vagus Nerve is the primary component of the parasympathetic nervous system. Establishing autonomic safety is the prerequisite for any lasting neural reconsolidation.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Definitions Section */}
      <section>
        <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
          <Info className="text-primary" />
          What it IS vs. What it IS NOT
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={20} />
                What it IS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• A structured method for updating the nervous system's predictive model of self.</p>
              <p>• A somatic-first approach to neural reconsolidation.</p>
              <p>• A clinical protocol for metabolizing resistance at the autonomic level.</p>
              <p>• A way to align your "felt sense" with your desired future state.</p>
            </CardContent>
          </Card>

          <Card className="border-rose-500/20 bg-rose-500/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <XCircle size={20} />
                What it IS NOT
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Just positive thinking or "faking it until you make it."</p>
              <p>• Cognitive reframing or logical debate with yourself.</p>
              <p>• Simple affirmations without somatic grounding.</p>
              <p>• A quick fix that bypasses the body's safety signals.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Clinical Hierarchy */}
      <section>
        <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
          <Layers className="text-primary" />
          The Clinical Hierarchy
        </h2>
        <div className="space-y-4">
          {[
            { step: 1, title: "Autonomic Safety", icon: Shield, desc: "Establishing a baseline of safety in the nervous system. Without safety, the brain will reject new identity models." },
            { step: 2, title: "Somatic Awareness", icon: Activity, desc: "Mapping the physical sensations associated with the current and target identities." },
            { step: 3, title: "Neural Reconsolidation", icon: Zap, desc: "The process of surfacing, challenging, and updating existing neural pathways through the reconsolidation loop." },
            { step: 4, title: "Identity Integration", icon: CheckCircle2, desc: "Anchoring the new identity into the present and future through behavioral and somatic checks." }
          ].map((item) => (
            <div key={item.step} className="flex gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-secondary/30 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 text-primary">
                <item.icon />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-full">STEP {item.step}</span>
                  <h3 className="font-bold">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default IdentityAlignmentBackground;