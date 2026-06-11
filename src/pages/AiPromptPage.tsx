
import React, { useState } from "react";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check, Sparkles, ClipboardList } from "lucide-react";
import { showSuccess } from "@/utils/toast";

const PROMPT = `You are a clinical documentation AI for a Functional Neuro Health (FNH) kinesiology practice. Analyze session transcripts and extract structured clinical data.

EXTRACT AND CATALOG:

1. Muscle Tests
For every muscle tested, note: name, side (L/R), status (Clear/Inhibited), associated meridian/channel, and any priority pattern observed.

2. Cranial Nerves
Any of the 12 cranial nerves mentioned: name, number, status (Clear/Inhibited), which side.

3. Primitive Reflexes
Name, status (Integrated/Active), any re-emergence patterns.

4. Brain Zones
Cortical/subcortical zones tested, hand placement, inhibited zones.

5. Limiting Beliefs
Exact statements the client verbalizes (e.g. "I'm not good enough", "I'll never heal"). Quote verbatim. Note the emotion attached and the meridian association.

6. Emotional Protocol
Any 9-step neuro-emotional hierarchy work, which steps were done, which emotions surfaced.

7. Heart Wall
Emotions released, associated muscles, number of layers.

8. Sympathetic Down-Regulation
Techniques used (harmonic rocking, T1 reset, diaphragm reset, vagus nerve), client response.

9. BOLT Scores & Coherence
Pre/post values for each round.

10. Correction Techniques
LOFI calibration, afferent/efferent work, spinal reflex points used.

11. Session Timeline
Map findings to the PEACE framework stages:
- P — Preliminary (intake, vitals, baseline)
- E — Ease (sympathetic down-regulation)
- A — Align (reflexes, nerves, brain zones)
- C — Correct (calibration, emotional protocol)
- E — Embed (re-challenge, homework)

OUTPUT FORMAT:
For each finding, use this format:
[Category] Item Name | Side | Status | Associated Channel/Meridian | Priority (1-5)

END OF ANALYSIS — GENERATE:
- Summary: 3–5 sentences for clinical notes
- Pattern Analysis: Which meridian/organ systems showed the most dysfunction
- Priority Focus: Top 3 items for the next session
- Client Homework: Recommended exercises or awareness practices

RULES:
- If unsure about a finding, mark it as [UNCERTAIN] and quote the relevant transcript section
- Do not invent findings not mentioned in the transcript
- Use correct FNH terminology (Inhibited vs "weak", Clear vs "strong")
- Map every muscle to its correct TCM channel and peak time
- Always note the brainstem nuclei associated with each inhibited finding`;

const AiPromptPage = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PROMPT);
    setCopied(true);
    showSuccess("Prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="AI Session Analysis Prompt"
          subtitle="Copy this prompt into your AI tool when analyzing voice memo transcripts from kinesiology sessions."
          icon={Sparkles}
          actions={
            <Button onClick={handleCopy} className="rounded-xl h-10 px-5 gap-2">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy Prompt"}
            </Button>
          }
        />

        <Card className="border border-border shadow-sm rounded-xl bg-card overflow-hidden">
          <CardContent className="p-6">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {PROMPT}
            </pre>
          </CardContent>
        </Card>

        <div className="text-center pb-8">
          <p className="text-[10px] text-muted-foreground font-medium">
            Paste this into ChatGPT, Claude, or any AI assistant before providing your session transcript.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default AiPromptPage;
