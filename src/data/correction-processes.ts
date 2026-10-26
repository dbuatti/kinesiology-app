// Shared correction process data — used by HowToSearch (and optionally by
// CorrectionsManualContent). Kept here so the shortcut can show direct
// instructions without navigating away.

export interface CorrectionProcess {
  id: string;
  title: string;
  group: "Afferent" | "Efferent" | "Heart Wall" | "Limiting Beliefs";
  subtitle: string;
  steps: string[];
  keywords?: string;
}

export const CORRECTION_PROCESSES: CorrectionProcess[] = [
  // --- Afferent ---
  {
    id: "aff-mechanoreceptor",
    title: "Mechanoreceptor (Unconscious)",
    group: "Afferent",
    subtitle: "Ligament / tendon threat — 85% afferent",
    steps: [
      "Confirm: inhibited indicator muscle → state 'afferent' → it facilitates (locks). X card or GV16 TL also facilitates.",
      "Localise: strong indicator + GV16 TL → bracket region → side → joint → touch specific ligament.",
      "Find stretch direction: stretch ligament in different directions — one direction inhibits the indicator.",
      "Correct: hold GV16 + maintain stretch direction + tuning fork on bone (+ optional rocking).",
      "Re-test the original muscle — it should now lock.",
    ],
    keywords: "ligament stretch cerebellum spinocerebellar",
  },
  {
    id: "aff-nociceptive",
    title: "Nociceptive (Threat Detection)",
    group: "Afferent",
    subtitle: "Threat site / pain",
    steps: [
      "Confirm: compress over suspected site → muscle locks after 5-10s.",
      "Hold thalamus point (Bl9 / occipitalis) to down-regulate.",
      "Re-apply the aggravating stimulus (light crude touch, joint impact, or pinch).",
      "Stack collateral inputs: look at site + breathe fast (sympathetics) + think of the suffering.",
      "Tuning fork + rocking to integrate.",
      "Reassess: site no longer inhibits, associated muscle restored.",
    ],
    keywords: "pain threat nociceptor thalamus",
  },
  {
    id: "aff-physiological",
    title: "Physiological",
    group: "Afferent",
    subtitle: "Organ / nutrition / hydration",
    steps: [
      "Address organ-specific reflexes identified during assessment.",
      "Check nutritional or hydration priorities driving the inhibition.",
      "Use specific neurolymphatic or neurovascular points for the identified organ.",
      "Consider meridian-based corrections if aligned with a TCM channel.",
      "Reassess the original inhibition pattern to confirm the correction held.",
    ],
    keywords: "organ nutrition hydration neurolymphatic",
  },
  // --- Efferent ---
  {
    id: "eff-cortical",
    title: "Cortical (Top-Down)",
    group: "Efferent",
    subtitle: "Cortical brain zones",
    steps: [
      "Identify the primary zone (PFC, M1, S1, Premotor, etc.) via indicator muscle challenge.",
      "Lateralise: Left or Right hemisphere based on the body side affected (contralateral).",
      "Identify a secondary zone (cortical or subcortical) that partners with the primary.",
      "Apply correction: Tap both zones simultaneously for 3-5s, OR hold + mentally repeat zone names until therapeutic pulse, OR TL both points + strike tuning fork on cranium.",
      "Include pathway name during intention: e.g. 'Left Psoas, Right PFC, Left Limbic'.",
      "Re-test the original inhibition — should clear.",
    ],
    keywords: "cortex PFC M1 S1 tapping",
  },
  {
    id: "eff-subcortical",
    title: "Subcortical (Autonomic)",
    group: "Efferent",
    subtitle: "Autonomic brain zones",
    steps: [
      "Identify the subcortical zone (Limbic, Cerebellum, Hypothalamus, Thalamus, etc.) via indicator challenge.",
      "Lateralise: Left = historical/past trauma, Right = current processing (ipsilateral).",
      "Apply correction: Tapping (3-5s), Holding + Intention (until pulse), or Tuning Fork.",
      "Re-test the original inhibition to confirm.",
    ],
    keywords: "limbic cerebellum hypothalamus thalamus autonomic",
  },
  {
    id: "eff-emotional",
    title: "Emotional (Pulse Point Protocol)",
    group: "Efferent",
    subtitle: "ESR / emotional correction",
    steps: [
      "ESR Check — Hold frontal lobe (GB14) ESR points. Test indicator muscle — should weaken with stressor.",
      "Permission — Ask 'Do we have permission to correct this?' If denied, do Harmonic Rocking first.",
      "Timeline — Determine if the stress is Current or Historic. If historic, narrow to specific age/month.",
      "Primary Emotion — Identify the core feeling: Hurt (Fire), Worry (Earth), Sadness (Metal), Fear (Water), Anger (Wood).",
      "Priority Organ — Find the organ surrogate via pulse point. Match its element to the emotion.",
      "Energy Polarity — Challenge for Energy IN (+) or Energy OUT (−). Usually OUT to release.",
      "Eye Position — Identify NLP sensory access (visual/auditory/kinesthetic) for the stress memory.",
      "Correction — Hold ESR + Pulse Point + Eye Position simultaneously. Replay stress until therapeutic shift (yawn, sigh, swallow, gurgle, deep breath).",
      "Upload — Once shift occurs, upload a positive/neutral state over the same access point.",
      "Re-test — Re-challenge ESR points and original stimulus. Muscle should now lock.",
    ],
    keywords: "emotion ESR pulse point NLP eye position",
  },
  // --- Heart Wall ---
  {
    id: "hw-screen",
    title: "Heart Wall — Screen",
    group: "Heart Wall",
    subtitle: "Is a Heart Wall present?",
    steps: [
      "Qualify an indicator muscle.",
      "Ask client to focus on their heart and imagine receiving — love, money, acceptance, care, or whatever is relevant.",
      "If the muscle inhibits (weakens), the Heart Wall is present. The word 'receiving' is key.",
    ],
    keywords: "heart wall screen receiving",
  },
  {
    id: "hw-assessment",
    title: "Heart Wall — Assessment Flow",
    group: "Heart Wall",
    subtitle: "Count layers, find priority primary",
    steps: [
      "Permission: ask 'Do we have permission to assess the Heart Wall?' If no, do Harmonic Rocking first, then re-ask.",
      "Count layers: ask 'How many layers?' Challenge: more than 5? 10? 15? 20? 25? Narrow to exact number.",
      "Find priority primary: challenge 'Mission to assess for priority primary'. Use pulse points to identify organ — right deep → Lung/Colon, left deep → Liver/Gallbladder.",
      "Once organ is known, scan the emotion chart for the specific emotion in that organ's row.",
      "Assess related muscles: test the muscles correlated to that emotion row — they will be inhibited.",
      "Find efferent coordinates: challenge Cortical → Subcortical → Cerebellum → Limbic. Write down the brain zones.",
      "Optional context: ask 'Do we need more context?' If yes: age? life event? absorbed or inherited? from Mom or Dad?",
    ],
    keywords: "heart wall layers priority primary organ",
  },
  {
    id: "hw-correction",
    title: "Heart Wall — Correction Flow",
    group: "Heart Wall",
    subtitle: "Clear the priority layer",
    steps: [
      "Permission: ask 'Do we have permission to correct the priority primary Heart Wall layer?'",
      "Stim Heart Visceral Referral Zone: lightly rub from chest, over shoulder, down ulnar (pinky) side of left arm.",
      "While rubbing, state intention: 'Heart wall, [organ], [emotion], inherited from [parent].' Repeat over 3 minutes.",
      "Hold organ pulse point or squeeze associated muscle (e.g. for Lung → squeeze Posterior Deltoid).",
      "Optional: ask client to place one hand on heart, other on the organ. 'Let them be friends again.'",
      "Tap efferent zones simultaneously while holding pulse point — 3 firm swipes (10 if inherited).",
      "Alternative: activate brain circuits then do Harmonic Rocking instead of holding for 3 minutes.",
    ],
    keywords: "heart wall correction tapping heart visceral",
  },
  {
    id: "hw-recheck",
    title: "Heart Wall — Recheck",
    group: "Heart Wall",
    subtitle: "Confirm the shift",
    steps: [
      "Wait for a parasympathetic shift: sigh, yawn, gurgle, or client says 'a wave came up' or 'something is leaving'.",
      "Re-test the associated muscles — they should now lock.",
      "State the emotion again — indicator should lock.",
      "Re-count remaining layers: 'How many layers remain?' Track the reduction from baseline.",
    ],
    keywords: "heart wall recheck parasympathetic",
  },
  // --- Limiting Beliefs ---
  {
    id: "lb-process",
    title: "Limiting Beliefs — A-E Cycle",
    group: "Limiting Beliefs",
    subtitle: "The A-H belief resolution process",
    steps: [
      "A: Feel the belief in your body — what do you notice? Where is it? What sensation?",
      "B: Follow the sensation deeper — is it changing, moving, shifting?",
      "C: Identify the desired state — what would you rather feel instead?",
      "D: Embody the alternative — feel that new state. What do you notice?",
      "E: Deepen the new feeling — let it expand. What do you notice?",
      "F: Does the original belief still feel true? (YES → restart A-E; NO → advance to G)",
      "G: Do you see yourself believing this in the future? (YES → restart; NO → advance to H)",
      "H: Is there any scenario where this belief might still feel true? (YES → restart; NO → session complete)",
    ],
    keywords: "limiting beliefs belief resolution A-E cycle",
  },
];
