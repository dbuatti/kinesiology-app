import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Quote, Brain, Sparkles, AlertCircle, Layers, Zap, Heart, Shield } from "lucide-react";

const IdentityShiftingBackground = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Philosophical Foundations */}
      <section>
        <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
          <Quote className="text-primary" />
          Philosophical Foundations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-secondary/20 border-none shadow-none hover:bg-secondary/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Carl Jung</CardTitle>
              <CardDescription className="italic">"Until you make the unconscious conscious, it will direct your life and you will call it fate."</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Jung's work on the shadow and the process of individuation is central to identity shifting. By bringing hidden aspects of the self into awareness, we can integrate them and move toward wholeness.
            </CardContent>
          </Card>

          <Card className="bg-secondary/20 border-none shadow-none hover:bg-secondary/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Terence McKenna</CardTitle>
              <CardDescription className="italic">"The cost of sanity in this society is a certain level of alienation."</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              McKenna emphasized the importance of deconditioning from cultural narratives. Identity shifting allows us to step outside the "constructed self" imposed by society.
            </CardContent>
          </Card>

          <Card className="bg-secondary/20 border-none shadow-none hover:bg-secondary/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Tao Te Ching</CardTitle>
              <CardDescription className="italic">"When I let go of what I am, I become what I might be."</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              The Taoist principle of Wu Wei (non-doing) and the fluidity of being. Letting go of fixed identities allows for the natural flow of life and transformation.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Concepts */}
      <section>
        <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
          <Brain className="text-primary" />
          Core Concepts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-secondary/30 shadow-sm">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold mb-2">Non-dual Reality</h3>
              <p className="text-sm text-muted-foreground">The understanding that the observer and the observed are one. Identity shifting works at the level where the "I" that has the problem dissolves into pure awareness.</p>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-secondary/30 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center shrink-0">
              <Layers className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold mb-2">Fragmentation</h3>
              <p className="text-sm text-muted-foreground">When we experience trauma or stress, our identity can fragment. We create "parts" to cope, which can later become rigid and problematic identities.</p>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-secondary/30 shadow-sm">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold mb-2">Resistance</h3>
              <p className="text-sm text-muted-foreground">Resistance is the glue that holds a problematic identity in place. By identifying and dissolving the resistance, the identity can shift naturally.</p>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-secondary/30 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold mb-2">Constructed vs. Authentic Self</h3>
              <p className="text-sm text-muted-foreground">The constructed self is a collection of labels, roles, and beliefs. The authentic self is the underlying awareness that remains when the constructs are seen through.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Indications */}
      <section>
        <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
          <AlertCircle className="text-primary" />
          When to Use This Tool
        </h2>
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Chronic Health Issues", icon: Heart, desc: "When physical symptoms are tied to deep-seated emotional patterns or self-image." },
              { title: "Mental Health", icon: Brain, desc: "For anxiety, depression, or persistent negative thought loops that feel like 'who I am'." },
              { title: "Addictions", icon: Zap, desc: "Breaking the 'addict' identity and the underlying voids it attempts to fill." },
              { title: "Limiting Beliefs", icon: Shield, desc: "When you feel stuck in a role or story that no longer serves your growth." },
              { title: "Relationship Patterns", icon: Heart, desc: "Repeating the same dynamics due to a fixed way of relating to yourself and others." },
              { title: "Spiritual Growth", icon: Sparkles, desc: "Exploring the nature of the self and moving toward non-dual awareness." }
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-primary">
                  <item.icon size={16} />
                  {item.title}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default IdentityShiftingBackground;