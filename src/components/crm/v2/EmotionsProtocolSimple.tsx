import { Heart, Info } from "lucide-react";

const STEPS = [
  {
    n: 1,
    title: "ESR Indicator Check",
    desc: "Hold Frontal Lobe (ESR) points (GB14) to see if the system is ready for emotional work.",
  },
  {
    n: 2,
    title: "Permission Check",
    desc: "Always ask: 'Do we have permission to correct this?' If denied, perform Harmonic Rocking first.",
  },
  {
    n: 3,
    title: "Timeline Selection",
    desc: "Determine if the stress is Current (happening now) or Historic (past event).",
  },
  {
    n: 4,
    title: "Timeline Regression",
    desc: "If historic, narrow down the specific age and month of origin using the indicator muscle.",
  },
  {
    n: 5,
    title: "Primary Emotion",
    desc: "Identify the core feeling: Hurt (Fire), Worry (Earth), Sadness (Metal), Fear (Water), or Anger (Wood).",
  },
  {
    n: 6,
    title: "Priority Organ",
    desc: "Find the organ acting as a surrogate for the charge. Must be related to the emotion's element:",
    table: [
      { element: "Wood (Anger)", organs: "Liver / Gallbladder" },
      { element: "Fire (Hurt)", organs: "Heart / Small Intestine" },
      { element: "Earth (Worry)", organs: "Spleen / Stomach" },
      { element: "Metal (Sadness)", organs: "Lung / Large Intestine" },
      { element: "Water (Fear)", organs: "Kidney / Bladder" },
    ],
  },
  {
    n: 7,
    title: "Energy Polarity",
    desc: "Challenge for Energy IN (+) or Energy OUT (-). Usually OUT to release stress.",
  },
  {
    n: 8,
    title: "Eye Position (NLP Logic)",
    desc: "Identify the sensory access point for the stress:",
    table: [
      { element: "Up & Left", organs: "Visual Memory — Seeing a scene from the past" },
      { element: "Horizontal Left", organs: "Auditory Memory — Hearing sounds or words from the past" },
      { element: "Down & Left", organs: "Internal Monologue — What you say to yourself" },
      { element: "Up & Right", organs: "Visual Constructed — Predicting what you think you will see" },
      { element: "Horizontal Right", organs: "Auditory Constructed — Predicting what you think you will hear" },
      { element: "Down & Right", organs: "Kinesthetic / Felt Sense — Physical sensation or body association" },
    ],
  },
  {
    n: 9,
    title: "Correction & Upload",
    desc: "Hold ESR + Pulse Point + Eye Position. Replay stress until shift, then upload positive state.",
  },
];

const EmotionsProtocolSimple = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2">
        <Heart size={16} className="text-rose-500" />
        <h2 className="text-sm font-bold text-foreground">Neuro-Emotional Integration</h2>
        <span className="text-[10px] text-muted-foreground font-medium">9-Step Clinical Protocol</span>
      </div>

      {STEPS.map((step) => (
        <div key={step.n} className="flex gap-3">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center text-xs font-bold shrink-0">
            {step.n}
          </div>
          <div className="space-y-1.5 pb-1">
            <h3 className="text-xs font-bold text-foreground">{step.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            {step.table && (
              <div className="mt-2 space-y-0.5">
                {step.table.map((row, i) => (
                  <div key={i} className="flex gap-2 text-[11px]">
                    <span className="font-semibold text-foreground min-w-[120px]">{row.element}</span>
                    <span className="text-muted-foreground">{row.organs}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="flex items-start gap-2 pt-3 border-t border-border">
        <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Hold the pulse point corresponding to the priority organ (Step 6). Use light pressure for Yang organs, deep pressure for Yin organs.
        </p>
      </div>
    </div>
  );
};

export default EmotionsProtocolSimple;