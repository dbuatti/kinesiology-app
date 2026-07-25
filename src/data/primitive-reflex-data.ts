
export interface PrimitiveReflex {
  id: string;
  name: string;
  category: 'Foundational' | 'Postural' | 'Tactile';
  stimulus: string;
  inhibitionPattern: string;
  howTo: string;
  isLateralized: boolean;
  description?: string;
  pearl?: string;
  hierarchyLevel?: number;
  fractalPartners?: string[];
  clinicalSigns?: string[];
  developmentalWindow?: string;
  videoUrl?: string;
  pageUrl?: string;
  track?: number;
  isBoss?: boolean;
  bossTitle?: string;
  relatedBrainAreas?: string[];
  dysfunctionConsequences?: string;
  clinicalNotes?: string;
}

export const PRIMITIVE_REFLEXES: PrimitiveReflex[] = [
  {
    id: 'fear-paralysis',
    name: 'Fear Paralysis Reflex',
    category: 'Foundational',
    hierarchyLevel: 1,
    track: 1,
    isBoss: true,
    bossTitle: 'Boss of: Dorsal Vagal / Immobilisation Response',
    isLateralized: false,
    developmentalWindow: "In utero (5–12 weeks). Inhibits: By birth.",
    stimulus: 'Any unexpected stimulus (sound, motion, tap etc.)',
    inhibitionPattern: 'Withdrawal from stimulus or Global Inhibition — test multiple muscles to confirm global shutdown pattern.',
    howTo: 'While working on the client (unexpectedly), make a loud sound above their head. Test a clear indicator muscle immediately.',
    description: 'The foundational master reflex of Track 1. Boss of the Dorsal Vagal immobilisation response. When retained, it acts as a master override — suppressing output from all other reflexes and making test results unreliable.',
    pearl: 'Master reflex of Track 1 — correcting FPR often resolves multiple reflexes simultaneously. Clients with retained FPR are more likely to have a healing crisis post-session. Often triggered by head injury or concussion. Boss of the Dorsal Vagal immobilisation response.',
    clinicalSigns: [
      'Procrastination, fatigue, overwhelm',
      'Global muscle inhibition or withdrawal',
      'Freezing response in high-stress situations',
      'Healing crisis post-session',
      'Nervous system stuck in parasympathetic shutdown'
    ],
    relatedBrainAreas: ['Limbic', 'Pons', 'Cerebellum', 'Thalamus', 'Insular Cortex', 'Pre-Frontal Cortex'],
    dysfunctionConsequences: 'Chronic dorsal vagal shutdown — client presents as flat, disconnected, fatigued. Global muscle inhibition makes standard assessment unreliable. Healing crises are common post-session as the nervous system re-activates. Linked to dissociation, freeze states, and inability to initiate action.',
    clinicalNotes: 'FPR sits at the top of the Track 1 hierarchy. When retained, it acts as a master override — suppressing output from all other reflexes and making test results unreliable. Always check FPR first when a client presents with global inhibition or a history of early developmental stress.',
    fractalPartners: ['Moro', 'Startle'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/7d40f82dbdf33d51bdc9195adec04a9d0e8b5c7f.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167094242"
  },
  {
    id: 'moro',
    name: 'Moro Reflex',
    category: 'Foundational',
    hierarchyLevel: 2,
    track: 1,
    isBoss: true,
    bossTitle: 'Boss of: Sympathetic Fight/Flight Response',
    isLateralized: false,
    developmentalWindow: "In utero (~9–12 weeks). Inhibits: 2–4 months.",
    stimulus: 'Gently but suddenly lower the head.',
    inhibitionPattern: 'Pecs and neck extensors inhibit — try to pull the arms away from the midline.',
    howTo: 'With the client supine, support the head and perform a quick (but safe) drop into extension. Re-test Pec Major Clavicular.',
    description: 'The earliest fight/flight mechanism. Boss of the sympathetic fight/flight response. When retained in adults it acts as a hair-trigger for the sympathetic nervous system — any unexpected sensory input can activate the full stress cascade. The Moro turns into the Startle reflex after integration at ~3–4 months.',
    pearl: 'Stage 1 is extension/inhale; Stage 2 is flexion/ball. Retained Moro creates a massive constant neural load. Earliest form of Fight/Flight — activated from the Brainstem. At birth the CNS is not equipped to analyse incoming sensory information.',
    clinicalSigns: [
      'Hypersensitivity to sensory input (light, sound, touch)',
      'Emotional dysregulation — overreaction to minor stressors',
      'Chronic sympathetic dominance',
      'Poor impulse control',
      'Anxiety and hypervigilance',
      'Adrenal fatigue patterns'
    ],
    relatedBrainAreas: ['Brainstem', 'Limbic', 'Amygdala', 'Hypothalamus'],
    dysfunctionConsequences: 'Chronic sympathetic activation — client is stuck in fight/flight. Presents with anxiety, hypervigilance, poor sleep, adrenal fatigue, and emotional reactivity. Sensory hypersensitivity is common. Long-term retention contributes to HPA axis dysregulation and immune suppression.',
    clinicalNotes: 'The Moro is the earliest fight/flight mechanism. When retained in adults it acts as a hair-trigger for the sympathetic nervous system — any unexpected sensory input can activate the full stress cascade. The Moro turns into the Startle reflex after integration at ~3–4 months.',
    fractalPartners: ['TLR (Extension)', 'TLR (Flexion)', 'ATNR', 'STNR (Extension)', 'STNR (Flexion)'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/7bee9c3cc03da234cda80dfd2f796c3a80b55414.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502429"
  },
  {
    id: 'startle',
    name: 'Startle Reflex',
    category: 'Foundational',
    hierarchyLevel: 3,
    track: 1,
    isBoss: true,
    bossTitle: 'Boss of: Sympathetic Fight/Flight Response (integrated Moro)',
    isLateralized: false,
    developmentalWindow: "Emerges ~3–4 months (integrated from Moro). Inhibits: 12 months.",
    stimulus: 'Gently but suddenly lower the head.',
    inhibitionPattern: 'Shoulder extensors inhibit — try to pull arms towards the midline (reverse of Moro pattern).',
    howTo: 'Same stimulus as Moro. Test upper body extensors or Hamstrings. Note: Cannot be active simultaneously with Moro.',
    description: 'Moro turns into Startle after integration — same trigger, reverse inhibition pattern. Sympathetic boss alongside Moro and Tendon Guard. Startle causes an inverted breathing pattern — important for respiratory assessment.',
    pearl: 'Moro is about "opening," Startle is about "closing." High correlation with chronic defensive posturing. The key clinical distinction between Moro and Startle is the inhibition direction: Moro inhibits pecs/neck extensors (arms fly out), Startle inhibits shoulder extensors (arms flex in).',
    clinicalSigns: [
      'Inverted breathing pattern',
      'Exaggerated startle response',
      'Chronic upper chest breathing',
      'Shoulder and neck tension',
      'Anxiety and hypervigilance',
      'Difficulty relaxing'
    ],
    relatedBrainAreas: ['Brainstem', 'Limbic', 'Amygdala'],
    dysfunctionConsequences: 'Persistent inverted breathing pattern — upper chest dominant, diaphragm inhibited. Contributes to chronic sympathetic tone, poor CO2 tolerance (low BOLT score), and upper cervical tension. Often presents alongside retained Moro in adults with anxiety disorders.',
    clinicalNotes: 'The key clinical distinction between Moro and Startle is the inhibition direction: Moro inhibits pecs/neck extensors (arms fly out), Startle inhibits shoulder extensors (arms flex in). Both are sympathetic bosses and should be assessed together.',
    fractalPartners: ['Fear Paralysis', 'Moro'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/7bee9c3cc03da234cda80dfd2f796c3a80b55414.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502429"
  },
  {
    id: 'rooting',
    name: 'Rooting Reflex',
    category: 'Tactile',
    track: 2,
    isLateralized: true,
    developmentalWindow: "In utero (~28 weeks). Inhibits: 3–4 months.",
    stimulus: 'Stroke side of cheek.',
    inhibitionPattern: 'Head turns towards stimulus; inhibits ipsilateral SCM.',
    howTo: 'Stroke the cheek near the mouth. Test the SCM on the SAME side (lift head and rotate towards the stimulus).',
    description: 'Used so the newborn can find mother\'s nipple to feed. Involves stimulation to side of mouth which turns head towards it reflexively. Mediated primarily through CN V (Trigeminal) and CN VII (Facial).',
    pearl: 'Massive effect on neck/shoulder stability. Often shows up in cases of torticollis or chronic TMJ tension. When retained, it creates a persistent oral-motor drive that can manifest as thumb sucking, nail biting, or oral sensory seeking in older children and adults.',
    clinicalSigns: [
      'TMJ tension',
      'Neck instability',
      'Torticollis',
      'Shoulder pain',
      'Speech issues'
    ],
    relatedBrainAreas: ['Brainstem (CN V, VII)', 'Limbic', 'Hypothalamus'],
    dysfunctionConsequences: 'Oral hypersensitivity and facial touch defensiveness. Difficulty with oral motor control — impacts speech clarity, chewing, and dental tolerance. Retained Rooting can contribute to jaw tension and TMJ dysfunction through persistent SCM inhibition patterns.',
    clinicalNotes: 'The Rooting reflex is mediated primarily through CN V (Trigeminal) and CN VII (Facial). When retained, it creates a persistent oral-motor drive that can manifest as thumb sucking, nail biting, or oral sensory seeking in older children and adults.',
    fractalPartners: ['Sucking', 'Palmar'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/41602c6f9a8558cd636f09d1f791a90095949ddc.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2170115837"
  },
  {
    id: 'tlr',
    name: 'Tonic Labyrinthine Reflex',
    category: 'Foundational',
    track: 1,
    isLateralized: false,
    developmentalWindow: "In utero. Inhibits: 3–4 months (flexion) / 6–8 months (extension).",
    stimulus: 'With patient in supine, ask patient to actively flex or extend BOTH head and lumbar spine simultaneously.',
    inhibitionPattern: 'Neck + Lumbar FLEXION: All upper and lower body EXTENSORS inhibit (erectors, glutes, hamstrings, triceps). Neck + Lumbar EXTENSION: All upper and lower body FLEXORS inhibit (hip flexors, biceps, abs, neck flexors).',
    howTo: 'Patient supine. Ask patient to actively flex both neck and lumbar spine (tests extensor inhibition). Then actively extend both (tests flexor inhibition).',
    description: 'TLR is a sagittal-plane reflex — it responds to head and trunk movement in the flexion/extension axis. The dual stimulus (both head AND lumbar) is important: testing head alone will not reliably activate the full TLR inhibition pattern.',
    pearl: 'Essential for sensory mapping of the neck. Retained TLR often manifests as sleep issues or "somersaulting" sensations. The dual stimulus (both head AND lumbar) is critical — testing head alone will not reliably activate the full TLR inhibition pattern.',
    clinicalSigns: [
      'Left/Right/Up/Down confusion',
      'Poor postural control',
      'Avoidance of moving head into extension',
      'Dizziness and vestibular disorders',
      'Visual problems (Saccades, Pursuits, VOR)',
      'Crawling issues in children (walking issues in adults)'
    ],
    relatedBrainAreas: ['Vestibular nuclei (Pons/Medulla)', 'Cerebellum', 'Brainstem'],
    dysfunctionConsequences: 'Vestibular-postural dysregulation — client cannot reliably orient in space. VOR dysfunction leads to visual tracking problems and reading difficulties. Poor postural tone creates compensatory patterns throughout the spine. Dizziness and motion sensitivity are common clinical presentations.',
    clinicalNotes: 'TLR is a sagittal-plane reflex — it responds to head and trunk movement in the flexion/extension axis. The dual stimulus (both head AND lumbar) is important: testing head alone will not reliably activate the full TLR inhibition pattern.',
    fractalPartners: ['Moro', 'ATNR', 'STNR (Extension)', 'STNR (Flexion)'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/e408efa2796ae592f7a4e66f18c5fc3f6072865e.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502436"
  },
  {
    id: 'stnr',
    name: 'Symmetric Tonic Neck Reflex',
    category: 'Postural',
    track: 1,
    isLateralized: false,
    developmentalWindow: "6–9 months. Inhibits: 9–11 months.",
    stimulus: 'Stim 1: Neck forward (flexion) from seated. Stim 2: Tip neck backward (extension) from seated.',
    inhibitionPattern: 'Neck FLEXION (Stim 1): Neck extensors, arm extensors (Triceps) and leg flexors (Hamstrings) inhibit. Neck EXTENSION (Stim 2): Neck flexors, arm flexors (Biceps) and hip extensors (Glutes) inhibit.',
    howTo: 'Client seated. Stim 1: Bring head forward into flexion — test neck/arm extensors and hamstrings. Stim 2: Tilt head back into extension — test upper flexors and quads.',
    description: 'STNR is the sagittal complement to ATNR. Where ATNR is about lateral/rotational dissociation, STNR is about sagittal dissociation — the ability to flex/extend the head without the arms and legs following. Plays a role in acquiring intentional movement. Controls position of head and body for visual and auditory perception. Integrates alongside ATNR at 9–11 months.',
    pearl: 'The "cat" reflex. Retained STNR is a major factor in poor desk posture and "W-sitting". Plays a role in acquiring intentional movement and controls position of head and body for visual and auditory perception.',
    clinicalSigns: [
      'Poor sitting posture — slumping or W-sitting',
      'Difficulty with tasks requiring head position changes',
      'Poor hand-eye coordination',
      'Difficulty focusing visually when moving',
      'Crawling and walking coordination issues'
    ],
    relatedBrainAreas: ['Brainstem', 'Cerebellum', 'Vestibular nuclei'],
    dysfunctionConsequences: 'Upper-lower body dissociation — the head and trunk cannot move independently of the limbs. Poor sitting posture, difficulty with tasks that require simultaneous head movement and hand use (writing, eating). Contributes to visual tracking problems and learning difficulties.',
    clinicalNotes: 'STNR is the sagittal complement to ATNR. Where ATNR is about lateral/rotational dissociation, STNR is about sagittal dissociation — the ability to flex/extend the head without the arms and legs following. Both integrate around the same time (9–11 months).',
    fractalPartners: ['Moro', 'TLR (Extension)', 'TLR (Flexion)', 'ATNR'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/aabf70381b505e23b702daababd25c1cd36e94e1.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502433"
  },
  {
    id: 'atnr',
    name: 'Asymmetric Tonic Neck Reflex',
    category: 'Postural',
    track: 2,
    isBoss: true,
    bossTitle: 'Boss of: Track 2 — Unilateral / Gait-Based',
    isLateralized: true,
    developmentalWindow: "In utero (~18 weeks). Inhibits: 6–9 months.",
    stimulus: 'Turn head and eyes to one side in one movement with head in slight extension (Supine, Seated or Standing).',
    inhibitionPattern: 'Inhibition of ipsilateral upper body (Anterior Deltoids) and leg flexors (Quads); contralateral arm and leg extensors (Glute Max) inhibit.',
    howTo: 'Client tilts head back and rotates to one side. Test same-side flexors (Anterior Deltoid) and opposite-side Glutes. Functional test: Arms out front, eyes closed — rotate head L/R and observe if arms follow.',
    description: 'Boss of Track 2. Major factor in head and neck dissociation. Vestibular and ocular mapping. Hand-eye coordination. Writing in a straight line. Visual pursuits. When retained, it prevents the body from dissociating left from right — a fundamental requirement for walking, running, and any cross-body movement.',
    pearl: 'Huge impact on gait and vision. A classic clinical sign is getting tired quickly when reading. Functional test: Arms out front, eyes closed — rotate head L/R and observe if arms follow.',
    clinicalSigns: [
      'Tired when reading',
      'Poor handwriting',
      'Midline crossing issues',
      'Uncoordinated gait',
      'Functional scoliosis',
      'Left/Right confusion',
      'Visual tracking issues',
      'Difficulty writing in a straight line'
    ],
    relatedBrainAreas: ['Brainstem', 'Vestibular nuclei', 'Cerebellum', 'Motor cortex'],
    dysfunctionConsequences: 'Inability to cross the midline — affects gait, writing, and bilateral coordination. Scoliosis risk from asymmetric extensor tone. Visual tracking problems affect reading and sports performance. As the boss of Track 2, retained ATNR often underlies multiple unilateral movement dysfunctions.',
    clinicalNotes: 'ATNR is the boss of Track 2. When retained, it prevents the body from dissociating left from right — a fundamental requirement for walking, running, and any cross-body movement. The functional standing test (arms out, eyes closed, rotate head) is a quick screen for retained ATNR in adults.',
    fractalPartners: ['Moro', 'TLR (Extension)', 'TLR (Flexion)', 'STNR (Extension)', 'STNR (Flexion)'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/896c250c771ff9c61de1176371bcaa86882f7685.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502432"
  },
  {
    id: 'spinal-galant',
    name: 'Spinal Galant Reflex',
    category: 'Postural',
    track: 2,
    isLateralized: true,
    developmentalWindow: "In utero (~20 weeks). Inhibits: 3–9 months.",
    stimulus: 'Stroke along one side of spine from inferior angle of Scapula to Sacrum.',
    inhibitionPattern: 'Ipsilateral hip curves up and outwards; inhibition of ipsilateral Glutes and contralateral Oblique and QL.',
    howTo: 'Client prone. Stroke skin in a "C" curve from the spine outwards along the lumbar erectors. Test same-side Glute and opposite-side QL.',
    description: 'Unilateral reflex — it responds to lateral skin stimulation along the spine. Plays a key role in gait development (lateral weight shift) and bladder maturation. Retained Galant is one of the most common reflexes found in children with ADHD-like presentations.',
    pearl: 'Linked to bedwetting and concentration issues. In adults, manifests as functional scoliosis. Plays a key role in gait development (lateral weight shift) and bladder maturation.',
    clinicalSigns: [
      'Bed-wetting (enuresis)',
      'Restless, fidgety — cannot sit still',
      'Scoliosis',
      'Concentration and focus issues',
      'Psychological defensiveness',
      'Sensitivity to clothing on the back'
    ],
    relatedBrainAreas: ['Spinal cord', 'Brainstem', 'Cerebellum'],
    dysfunctionConsequences: 'Persistent lateral spinal hypersensitivity — clients cannot tolerate clothing touching their back, sitting still is difficult. Bladder control issues (enuresis) in children. Contributes to scoliosis through asymmetric paraspinal tone. Psychological defensiveness and concentration difficulties are common adult presentations.',
    clinicalNotes: 'The Spinal Galant is a unilateral reflex — it responds to lateral skin stimulation along the spine. It plays a key role in gait development (lateral weight shift) and bladder maturation. Retained Galant is one of the most common reflexes found in children with ADHD-like presentations.',
    fractalPartners: ['ATNR'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/f2469cc91db04dd15d9f35717be09af96691be5d.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502438"
  },
  {
    id: 'palmar',
    name: 'Palmar Grasp Reflex',
    category: 'Tactile',
    track: 2,
    isLateralized: true,
    developmentalWindow: "In utero (~11 weeks). Inhibits: 4–6 months.",
    stimulus: 'Stroke the palm of the hand.',
    inhibitionPattern: 'Finger extensors inhibit.',
    howTo: 'Apply a firm stroke straight down the center of the palm. Test the finger extensors (should inhibit if active).',
    description: 'Involuntary hand grasp. Part of the gait integration chain. The Palmar Grasp is assessed by stroking the palm only — the ATNR head-turn is not part of this assessment.',
    pearl: 'Affects manual dexterity and handwriting. The palms are part of the gait integration circuit. Retained Palmar Grasp is a common finding in children with handwriting difficulties and adults with chronic hand tension or grip-release problems.',
    clinicalSigns: [
      'Poor fine motor control',
      'Difficulty releasing objects voluntarily',
      'Pencil grip issues',
      'Handwriting difficulties',
      'Tactile hypersensitivity in the hands'
    ],
    relatedBrainAreas: ['Motor cortex (M1)', 'Cerebellum', 'Brainstem'],
    dysfunctionConsequences: 'Persistent finger flexor dominance — difficulty releasing grip voluntarily. Fine motor control is compromised, affecting handwriting, tool use, and precision tasks. Tactile hypersensitivity in the palms can make everyday touch uncomfortable.',
    clinicalNotes: 'The Palmar Grasp is assessed by stroking the palm only — the ATNR head-turn is not part of this assessment. Retained Palmar Grasp is a common finding in children with handwriting difficulties and adults with chronic hand tension or grip-release problems.',
    fractalPartners: ['Rooting', 'Sucking', 'Babinski'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/47c826247d5f8aa9592a5a681c8dff91feb137d3.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2190363557"
  },
  {
    id: 'babinski',
    name: 'Babinski Reflex',
    category: 'Tactile',
    track: 2,
    isLateralized: true,
    developmentalWindow: "Birth. Inhibits: 12–24 months.",
    stimulus: 'Stroke from lateral heel upwards and across towards ball of foot.',
    inhibitionPattern: 'Normal (negative) response: toes fan up and out, big toe turns downward — inhibition of toe flexors. Positive sign in adults: toes fan up and out (indicates CST dysfunction).',
    howTo: 'Stroke the sole starting at the lateral heel, wrapping up the edge and across the metatarsal arch. Test toe flexors.',
    description: 'Tests integrity of the Corticospinal Tract (CST). CST is a descending fibre tract from cerebral cortex through brainstem and spinal cord. Can also relate to a lower motor neuron lesion at S1 or S2. Positive Babinski in adults = CST dysfunction.',
    pearl: 'If active in adults, it "screws up" gait integration and can cause chronic ankle instability. Babinski has a dual clinical role in FNH: as a Track 2 retained primitive reflex (gait-based) AND as a CST integrity test. A positive sign in an adult always warrants further neurological investigation.',
    clinicalSigns: [
      'Gait abnormalities',
      'Toe walking',
      'Foot hypersensitivity',
      'Balance and proprioception issues',
      'Lower limb coordination difficulties'
    ],
    relatedBrainAreas: ['Corticospinal Tract (CST)', 'Motor cortex (M1)', 'Spinal cord (S1/S2)'],
    dysfunctionConsequences: 'Positive Babinski in adults indicates corticospinal tract dysfunction — a significant neurological finding. Gait abnormalities, toe walking, and lower limb coordination difficulties are common. The foot hypersensitivity from retained Babinski can also contribute to postural compensations throughout the kinetic chain.',
    clinicalNotes: 'Babinski has a dual clinical role in FNH: as a Track 2 retained primitive reflex (gait-based) AND as a CST integrity test. A positive sign in an adult always warrants further neurological investigation. In the FNH context, it is also assessed as part of the unilateral gait pattern alongside ATNR and Spinal Galant.',
    fractalPartners: ['Palmar'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/18739c5ea2d71bafc1e674974e51ad0408c2bae2.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502394"
  },
  {
    id: 'tendon-guard',
    name: 'Tendon Guard Reflex',
    category: 'Postural',
    track: 3,
    isBoss: true,
    bossTitle: 'Boss of: Sympathetic Response (global override)',
    isLateralized: true,
    developmentalWindow: "Can activate at any age; remains active under chronic stress.",
    stimulus: 'Stroke from ball of foot (1st MTP joint) towards the heel (opposite direction to Babinski).',
    inhibitionPattern: 'Dorsiflexion activates — test Plantarflexion (inhibits), Psoas (inhibits), SCM (inhibits). NOTE: Plantarflexion will usually go hypertonic and Psoas and SCM will inhibit after TGR stim.',
    howTo: 'Pre-test plantar flexors, psoas, and SCM in the clear. Stim the foot from the first MTP joint laterally toward the heel. Retest: plantar flexors go hypertonic, psoas inhibits, SCM inhibits. Use A/E process for correction.',
    description: 'A protective whole-body reflex triggered by perceived threat (physical, emotional, sensory). Results in global co-contraction — agonist and antagonist fire simultaneously, locking the body into a freeze or brace posture. Not a traditional neonatal reflex but often remains active in trauma survivors and those under chronic stress. Sits outside track 1 and track 2 as a "track 3" reflex, acting as a global override that can mask or distort other reflex responses.',
    pearl: 'Think of it as a lock screen on a phone — until you clear it, you cannot access the operating system. Often the hidden cause of "weird" reflex readings where expected reflexes do not appear. In adult systems this reflex may dominate testing even though fear paralysis is technically more primitive. Sympathetic boss alongside Moro and Startle.',
    clinicalSigns: [
      'Chronic whole-body tension and bracing',
      'Pulls body forward onto toes',
      'Lower back and neck contraction to stay upright',
      'Reduced spinal mobility',
      'Limited cerebrospinal fluid flow',
      'Brain fog and poor decision-making',
      'Emotional rigidity',
      'Chronic tension headaches',
      'Chronic bracing or rigidity',
      'Poor breathing (shallow, held, restricted)',
      'Toe gripping or forefoot loading (hammer toes)',
      'Locked knees when standing',
      'High vigilance, tension even at rest',
      'Frontal lobe suppression — anxiety, emotional overwhelm',
      'Poor access to reflex testing (masks other reflexes)'
    ],
    relatedBrainAreas: ['Cerebellum', 'Spinocerebellar tracts', 'Limbic system', 'Frontal lobe (when chronic)', 'Psoas (peripheral)'],
    dysfunctionConsequences: 'Global co-contraction — the entire body is locked in a brace posture. Chronic tension reduces spinal mobility and limits cerebrospinal fluid flow to the brain. Long-term activation impacts frontal lobe function: brain fog, poor planning, emotional rigidity. As a global override, it masks other reflex test results — if TGR is active, other reflex assessments are unreliable.',
    clinicalNotes: 'The Tendon Guard sits outside the Track 1/Track 2 hierarchy — it is a global override that can suppress all other reflex outputs. It is the third sympathetic boss (alongside Moro and Startle). Always assess TGR first if a client presents with global hypertonic patterns or when other reflex tests give inconsistent results. Clearing TGR often reveals the underlying reflex picture beneath.',
    fractalPartners: ['Fear Paralysis', 'Moro'],
  },
  {
    id: 'sucking',
    name: 'Sucking Reflex',
    category: 'Tactile',
    isLateralized: false,
    developmentalWindow: "Birth to 4 months",
    stimulus: 'Touch the roof of the mouth (hard palate).',
    inhibitionPattern: 'Jaw and deep neck flexors inhibit.',
    howTo: 'Client (or practitioner with glove) touches the roof of the hard palate. Test jaw/neck flexors.',
    description: 'Essential for early nutrition and oral-motor development.',
    pearl: 'Often tied to the Rooting and Palmar reflexes in a fractal cluster.',
    clinicalSigns: ['TMJ issues', 'Speech difficulties', 'Swallowing issues', 'Neck tension'],
    fractalPartners: ['Rooting', 'Palmar']
  }
];
