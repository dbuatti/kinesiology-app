"use client";

import { CRANIAL_NERVES } from "./cranial-nerve-data";

export type BrainRegionCategory = 'Cortical' | 'Subcortical' | 'Cranial Nerve';

export interface BrainReflexPoint {
  id: string;
  name: string;
  category: BrainRegionCategory;
  location: string; 
  stimulus?: string; 
  clinicalNote?: string;
  technique?: string;
  lateralization: 'Contralateral' | 'Ipsilateral' | 'Bilateral' | 'Mixed';
  acupoint?: string;
  pearl?: string;
  functions?: string[];
  dysfunctionSigns?: string[];
  assessmentProtocol?: string;
  nuclei?: 'Cortex' | 'Midbrain' | 'Pons' | 'Medulla';
  toneEffect?: 'Flexors' | 'Extensors' | 'None';
  videoUrl?: string;
  pageUrl?: string;
}

const CORTICAL_POINTS: BrainReflexPoint[] = [
  {
    id: 'pfc',
    name: 'Pre-Frontal Cortex',
    category: 'Cortical',
    location: 'Hand placement over anterolateral frontal skull — the large teal zone at the forehead',
    lateralization: 'Contralateral',
    functions: [
      'Executive function and decision-making',
      'Working memory and sustained attention',
      'Emotional regulation and impulse control',
      'Social behaviour and empathy',
      'Planning, problem-solving, and abstract thinking'
    ],
    dysfunctionSigns: [
      'Poor decision-making or impulsivity',
      'Difficulty with planning or organisation',
      'Emotional dysregulation or mood instability',
      'Reduced motivation or flat affect',
      'Social withdrawal or inappropriate behaviour'
    ],
    assessmentProtocol: 'Place hand flat over the anterolateral frontal skull (teal zone). Test Indicator Muscle (IM) before and after. Functional stimulation: mental arithmetic, reading, or planning task while holding the zone.',
    pearl: 'The PFC is the most common zone to assess first. Dysfunction here often reflects downstream effects of sub-cortical dysregulation.'
  },
  {
    id: 'pmc',
    name: 'Pre-Motor Cortex',
    category: 'Cortical',
    location: 'Hand placement over superior frontal skull, posterior to PFC — the blue zone',
    lateralization: 'Contralateral',
    functions: [
      'Planning and sequencing of voluntary movement',
      'Coordination of complex motor tasks',
      'Integration of sensory input for movement preparation',
      'Mirror neuron activity and motor learning'
    ],
    dysfunctionSigns: [
      'Difficulty initiating or sequencing movements',
      'Apraxia — inability to perform learned movements',
      'Poor motor coordination despite intact strength',
      'Difficulty learning new movement patterns'
    ],
    assessmentProtocol: 'Place hand over the superior frontal skull, posterior to the PFC zone. Test IM. Functional stimulation: ask client to visualise or rehearse a specific movement sequence while holding the zone.',
    pearl: 'The architect of movement. Active during visualization.'
  },
  {
    id: 'm1',
    name: 'Motor Cortex M1',
    category: 'Cortical',
    location: 'Hand placement along the central coronal strip — the dark blue zone running ear to ear over the crown',
    lateralization: 'Contralateral',
    functions: [
      'Direct control of voluntary movement',
      'Somatotopic motor map (homunculus)',
      'Fine motor control of hands, face, and speech',
      'Integration with basal ganglia and cerebellum for smooth movement'
    ],
    dysfunctionSigns: [
      'Weakness or paralysis of specific muscle groups',
      'Spasticity or abnormal muscle tone',
      'Loss of fine motor dexterity',
      'Contralateral motor deficits'
    ],
    assessmentProtocol: 'Place hand along the coronal strip from ear to ear. Test IM. Functional stimulation: visualise contracting a specific muscle group while holding the zone. Assess contralateral side if unilateral deficit.',
    pearl: 'The executioner of movement. Follows strict contralateral logic.'
  },
  {
    id: 's1',
    name: 'Sensory Cortex S1–S2',
    category: 'Cortical',
    location: 'Hand placement over parietal skull, posterior to the motor strip — the orange zone',
    lateralization: 'Contralateral',
    functions: [
      'Processing of touch, pressure, and proprioception',
      'Somatosensory map of the body (sensory homunculus)',
      'Pain and temperature perception',
      'Integration of sensory information for body awareness',
      'S2: secondary processing — tactile discrimination and memory'
    ],
    dysfunctionSigns: [
      'Numbness or tingling in specific body regions',
      'Altered pain perception (hyper- or hyposensitivity)',
      'Poor proprioception and body awareness',
      'Difficulty discriminating textures or shapes by touch'
    ],
    assessmentProtocol: 'Place hand along the parietal surface posterior to the motor strip. Test IM. Functional stimulation: apply crude touch to the relevant body area while holding the zone. Crude touch = light stroking of skin.',
    pearl: 'The sensory map. "Smudging" here leads to chronic pain.'
  },
  {
    id: 'visual',
    name: 'Visual Cortex',
    category: 'Cortical',
    location: 'Direct light stimulation into the eye (not a scalp contact) — occipital lobe processing',
    lateralization: 'Contralateral',
    functions: [
      'Processing of visual information from the retina',
      'Colour, shape, and motion perception',
      'Visual field mapping',
      'Integration of visual input with other sensory systems'
    ],
    dysfunctionSigns: [
      'Visual field defects or blind spots',
      'Difficulty processing visual information',
      'Visual hallucinations or distortions',
      'Poor visual-motor coordination'
    ],
    assessmentProtocol: 'Stimulation: shine a light directly into the eye (penlight or phone torch) while testing IM. No scalp contact required. Assess left and right eyes separately. Test IM response during light stimulation.',
    pearl: 'Visual Cortex is stimulated via the retina — light into the eye, not a scalp point. Do not confuse with OFC (BL1) which is a contact point at the inner canthus.'
  },
  {
    id: 'auditory',
    name: 'Auditory Cortex',
    category: 'Cortical',
    location: 'Single point inside the ear canal opening — bilateral, assessed separately',
    lateralization: 'Contralateral',
    functions: [
      'Processing of sound frequency, pitch, and rhythm',
      'Speech and language comprehension',
      'Auditory localisation and spatial hearing',
      'Integration of auditory input with limbic system'
    ],
    dysfunctionSigns: [
      'Hypersensitivity to sound (hyperacusis)',
      'Difficulty processing speech in noise',
      'Tinnitus or auditory distortions',
      'Poor auditory memory or processing speed'
    ],
    assessmentProtocol: 'Place fingertip gently at the opening of the ear canal. Test IM. Assess left and right ears separately. Functional stimulation: specific sound frequency or spoken word while holding the point.',
    pearl: 'Processing of sound. Deeply linked to language and rhythm.'
  },
  {
    id: 'insula',
    name: 'Insula',
    category: 'Cortical',
    location: 'Line along eyebrow from lateral to medial — directional stimulation pointing inward toward the nose',
    lateralization: 'Contralateral',
    functions: [
      'Interoception — sensing the internal state of the body',
      'Processing of pain, temperature, and visceral sensations',
      'Emotional awareness and empathy',
      'Homeostatic regulation and autonomic control',
      'Integration of body signals with conscious awareness'
    ],
    dysfunctionSigns: [
      'Poor body awareness or interoceptive disconnect',
      'Difficulty identifying emotions (alexithymia)',
      'Chronic pain or altered pain processing',
      'Autonomic dysregulation',
      'Dissociation from bodily sensations'
    ],
    assessmentProtocol: 'No fixed reflex point. Stimulate by running a finger along the eyebrow from lateral (outer) to medial (inner) — direction is important. Alternatively: ask client to sense their own heartbeat while testing IM. Assess bilateral.',
    pearl: 'The Insula has no scalp reflex point. The eyebrow stimulation is a directional technique — always lateral to medial (outward to inward toward nose).'
  }
];

const SUBCORTICAL_POINTS: BrainReflexPoint[] = [
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    category: 'Subcortical',
    acupoint: 'GV16',
    location: 'GV16 — Suboccipital hollow just below the external occipital protuberance, on the midline',
    lateralization: 'Ipsilateral',
    functions: [
      'Motor coordination, balance, and posture',
      'Timing and rhythm of movement',
      'Cerebellar-cortical communication loops',
      'Procedural learning and motor memory',
      'Modulation of cognitive and emotional processing'
    ],
    dysfunctionSigns: [
      'Ataxia — unsteady gait or coordination problems',
      'Dysmetria — overshooting or undershooting movements',
      'Tremor (intention tremor)',
      'Slurred speech (dysarthria)',
      'Cognitive-affective cerebellar syndrome'
    ],
    assessmentProtocol: 'Contact GV16 — the suboccipital hollow just below the bony protuberance at the base of the skull, on the midline. Test IM before and after. Hold point and test IM response during functional movement or balance challenge.',
    pearl: 'The cerebellum is the "little brain" that coordinates everything from movement to thought.'
  },
  {
    id: 'pons',
    name: 'Pons',
    category: 'Subcortical',
    acupoint: 'GV17',
    location: 'GV17 — External occipital protuberance itself, on the midline at the back of the skull',
    lateralization: 'Ipsilateral',
    functions: [
      'Relay station between cerebrum and cerebellum',
      'Regulation of breathing rhythm (pneumotaxic centre)',
      'Sleep and arousal regulation (REM sleep)',
      'Facial expression and speech motor control',
      'Processing of pain and temperature from the body'
    ],
    dysfunctionSigns: [
      'Breathing dysregulation',
      'Sleep disturbances or REM disruption',
      'Facial numbness or weakness',
      'Difficulty with fine speech articulation',
      'Altered pain processing'
    ],
    assessmentProtocol: 'Contact GV17 — the bony protuberance at the back of the skull on the midline (external occipital protuberance). Test IM. Note: GV17 is the protuberance itself; GV16 is the hollow just below it.',
    pearl: 'The Pons is the bridge. It regulates extensor tone and sleep cycles.'
  },
  {
    id: 'medulla',
    name: 'Medulla',
    category: 'Subcortical',
    acupoint: 'GB12 (Head-Wangu)',
    location: 'GB12 — Depression posterior and inferior to the mastoid process, bilateral',
    lateralization: 'Ipsilateral',
    functions: [
      'Control of vital autonomic functions: heart rate, blood pressure, breathing',
      'Vomiting and swallowing reflexes',
      'Relay of sensory and motor signals between brain and spinal cord',
      'Vagal tone regulation'
    ],
    dysfunctionSigns: [
      'Autonomic dysregulation (heart rate, blood pressure variability)',
      'Swallowing difficulties (dysphagia)',
      'Nausea or vomiting sensitivity',
      'Poor vagal tone and stress resilience'
    ],
    assessmentProtocol: 'Contact GB12 — the depression just posterior and inferior to the mastoid process (the bony bump behind the ear). Assess bilaterally. Test IM. Often combined with Medulla Breathing: hold point + deep diaphragmatic breath + test IM.',
    pearl: 'GB12 is also used in the Medulla Breathing correction — a key protocol for down-regulating the sympathetic threat response.'
  },
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    category: 'Subcortical',
    location: 'Bilateral horizontal oval: front edge at lateral orbital rim (outer eye corner), extending back along temporal bone to sphenoid wing',
    lateralization: 'Ipsilateral',
    functions: [
      'Memory consolidation — encoding short-term to long-term memory',
      'Spatial navigation and cognitive mapping',
      'Stress response regulation and cortisol modulation',
      'Contextual fear learning and extinction',
      'Pattern separation and completion'
    ],
    dysfunctionSigns: [
      'Memory impairment — difficulty forming new memories',
      'Spatial disorientation',
      'Chronic stress or PTSD patterns',
      'Difficulty contextualising past experiences',
      'Hippocampal atrophy from chronic cortisol elevation'
    ],
    assessmentProtocol: 'Place hand over the bilateral temporal region — front edge at the outer corner of the eye, extending back along the temporal bone. Test IM. Functional stimulation: recall a specific memory or spatial task while holding the zone.',
    pearl: 'The librarian of the brain. Highly sensitive to chronic stress and cortisol.'
  },
  {
    id: 'thalamus',
    name: 'Thalamus',
    category: 'Subcortical',
    acupoint: 'BL9',
    location: 'BL9 — Bilateral, close to midline, high on posterior occiput near the lambda (junction of sagittal and lambdoid sutures)',
    lateralization: 'Contralateral',
    functions: [
      'Primary sensory relay station — all sensory input except olfaction',
      'Gating and filtering of sensory information to cortex',
      'Regulation of consciousness, sleep, and alertness',
      'Motor relay between basal ganglia and cortex',
      'Pain modulation'
    ],
    dysfunctionSigns: [
      'Sensory processing disorders',
      'Altered consciousness or attention',
      'Chronic pain syndromes (thalamic pain)',
      'Sleep-wake cycle disruption',
      'Sensory gating failure — overwhelm from sensory input'
    ],
    assessmentProtocol: 'Contact BL9 — bilateral points close to the midline on the high posterior occiput, near the lambda. Test IM bilaterally. Often relevant in clients with sensory overwhelm, chronic pain, or sleep disorders.',
    pearl: 'The switchboard. It decides what information reaches your conscious mind.'
  },
  {
    id: 'basal_ganglia',
    name: 'Basal Ganglia (Nuclei)',
    category: 'Subcortical',
    acupoint: 'GB9',
    location: 'GB9 — Bilateral, lateral parietal skull above the ears (superior to the ear, on the temporal-parietal region)',
    lateralization: 'Contralateral',
    functions: [
      'Motor control — initiation and inhibition of movement',
      'Habit formation and procedural learning',
      'Reward processing and motivation',
      'Cognitive flexibility and task switching',
      'Emotional regulation via limbic connections'
    ],
    dysfunctionSigns: [
      'Parkinson\'s-like movement patterns (rigidity, bradykinesia)',
      'Obsessive-compulsive patterns',
      'Difficulty initiating or stopping actions',
      'Reduced motivation or anhedonia',
      'Repetitive behaviours or tics'
    ],
    assessmentProtocol: 'Contact GB9 — bilateral points on the lateral parietal skull, superior to the ear. Test IM bilaterally. Note: GB9 (not GB8) is the correct reference point for Basal Ganglia in FNH.',
    pearl: 'GB9 is the correct FNH acupoint for Basal Ganglia — not GB8. Confirm placement: superior to the ear on the lateral parietal skull.'
  },
  {
    id: 'limbic',
    name: 'Limbic System',
    category: 'Subcortical',
    location: 'Bilateral crescent arc wrapping posterior-inferior around the ear, ending at the mastoid tip where GB12 begins',
    lateralization: 'Ipsilateral',
    functions: [
      'Emotional processing and memory',
      'Fear and threat response (amygdala)',
      'Motivation and reward (nucleus accumbens)',
      'Olfactory processing',
      'Autonomic nervous system regulation'
    ],
    dysfunctionSigns: [
      'Emotional dysregulation — anxiety, fear, rage',
      'Trauma responses and hypervigilance',
      'Mood disorders',
      'Addiction patterns',
      'Difficulty with emotional memory processing'
    ],
    assessmentProtocol: 'Place hand in a crescent arc wrapping posterior-inferior around the ear, ending at the mastoid tip. Test IM. The Limbic zone is often assessed in conjunction with the PFC — PFC-Limbic imbalance is a common clinical finding.',
    pearl: 'The Limbic crescent ends at the mastoid tip where GB12 (Medulla) begins. These zones are anatomically adjacent and clinically related.'
  },
  {
    id: 'midbrain',
    name: 'Midbrain',
    category: 'Subcortical',
    acupoint: 'GV26',
    location: 'GV26 — Philtrum, the midline groove between the base of the nose and the upper lip',
    lateralization: 'Ipsilateral',
    functions: [
      'Visual and auditory reflex coordination',
      'Dopamine production (substantia nigra)',
      'Pain modulation (periaqueductal grey)',
      'Arousal and consciousness regulation',
      'Coordination of eye movements'
    ],
    dysfunctionSigns: [
      'Altered arousal states',
      'Dopaminergic dysfunction (motivation, reward)',
      'Chronic pain patterns',
      'Visual tracking or eye movement difficulties',
      'Parkinson\'s-related symptoms'
    ],
    assessmentProtocol: 'Hold GV26 (philtrum) while simultaneously delivering an auditory stimulus directly over the vertex (top of skull). This dual-point approach stimulates the tectum and the tectal tracks — specifically the audio-tectal pathway — to confirm midbrain function. Test IM before and after.',
    pearl: 'GV26 is also a classical emergency resuscitation point in acupuncture — use firm contact, not needling.'
  },
  {
    id: 'ofc',
    name: 'Orbitofrontal Cortex (OFC)',
    category: 'Subcortical',
    acupoint: 'BL1',
    location: 'BL1 — Inner canthus of the eye, bilateral contact point (NOT light stimulation — contact only)',
    lateralization: 'Contralateral',
    functions: [
      'Integration of emotional and sensory information',
      'Decision-making based on reward and punishment',
      'Olfactory processing and integration',
      'Social and emotional behaviour regulation',
      'Modulation of the amygdala response'
    ],
    dysfunctionSigns: [
      'Impulsive decision-making',
      'Difficulty learning from consequences',
      'Altered olfactory processing',
      'Social disinhibition',
      'Emotional decision-making deficits'
    ],
    assessmentProtocol: 'Contact BL1 — the inner corner of the eye (inner canthus), bilaterally. This is a gentle contact point only — do NOT shine light into the eye for this zone. Test IM bilaterally.',
    pearl: 'BL1 (OFC) is a contact point at the inner canthus — completely separate from the Visual Cortex light stimulation. Do not confuse the two.'
  },
  {
    id: 'hypothalamus',
    name: 'Hypothalamus',
    category: 'Subcortical',
    acupoint: 'GV20 (secondary)',
    location: 'Primary stim: Tip of tongue pressed firmly to the hard palate (roof of mouth). Secondary stim: GV20 — crown of the skull, midline at the vertex.',
    lateralization: 'Bilateral',
    functions: [
      'Master regulator of the autonomic nervous system (sympathetic and parasympathetic balance)',
      'Hormonal control via the hypothalamic-pituitary axis (HPA axis)',
      'Body temperature regulation (thermoregulation)',
      'Hunger, thirst, and satiety signalling',
      'Circadian rhythm and sleep-wake cycle regulation',
      'Emotional regulation — integrates limbic input with physiological response',
      'Stress response coordination — triggers cortisol and adrenaline release',
      'Reproductive function and libido regulation',
      'Cardiovascular regulation — heart rate and blood pressure',
      'Osmolarity and fluid balance (ADH/vasopressin release)'
    ],
    dysfunctionSigns: [
      'Temperature dysregulation — cold hands/feet, inability to thermoregulate',
      'Hormonal imbalances — thyroid, adrenal, reproductive axis disruption',
      'Chronic fatigue and sleep disorders',
      'Dysautonomia — heart rate variability issues, POTS-like symptoms',
      'Appetite dysregulation — overeating, undereating, or cravings',
      'Excessive thirst or fluid retention',
      'Mood instability linked to hormonal fluctuation',
      'Chronic stress patterns with HPA axis dysregulation',
      'Reproductive dysfunction or libido changes'
    ],
    assessmentProtocol: 'Primary stim: Client presses the tip of their tongue firmly to the hard palate (roof of mouth) and holds. This activates the palatal reflex pathway directly connected to the hypothalamus via the trigeminal and vagal nuclei. Secondary stim: Contact GV20 at the crown of the skull (vertex, midline). Test IM before and after. Can combine both simultaneously for a stronger stimulus.',
    pearl: 'The Hypothalamus is the master homeostatic regulator — it connects the nervous system to the endocrine system. The tongue-to-palate stim is highly effective because the hard palate is richly innervated by CN V (trigeminal) branches that project directly to hypothalamic nuclei.'
  },
  {
    id: 'acc',
    name: 'Anterior Cingulate Cortex (ACC)',
    category: 'Subcortical',
    location: 'Auricular reflex point — ear-based stimulation. Associated muscle: Occipitalis',
    lateralization: 'Mixed',
    functions: [
      'Regulation of emotional and cognitive processes',
      'Conflict monitoring and error detection',
      'Pain processing and modulation',
      'Decision-making and performance monitoring',
      'Initiation and maintenance of goal-directed behaviour'
    ],
    dysfunctionSigns: [
      'Anxiety and fear processing dysregulation',
      'Difficulty with conflict resolution',
      'Chronic pain sensitivity',
      'Poor error detection or perseveration',
      'Emotional-cognitive integration problems'
    ],
    assessmentProtocol: 'Stimulate via the auricular reflex point (ear-based). Associated muscle: Occipitalis. Test IM before and after stimulation. The ACC bridges emotional and cognitive processing — assess when both domains are implicated.',
    pearl: 'The ACC is located in the medial prefrontal cortex. It bridges limbic (emotional) and prefrontal (cognitive) processing — often relevant in chronic pain, anxiety, and trauma presentations.'
  }
];

const MAPPED_CRANIAL_NERVES: BrainReflexPoint[] = CRANIAL_NERVES.map(nerve => ({
  id: `cn${nerve.id}`,
  name: `${nerve.name}: ${nerve.latinName}`,
  category: 'Cranial Nerve',
  location: nerve.reflexPoint,
  stimulus: nerve.stimulus,
  lateralization: nerve.id === 2 ? 'Contralateral' : 'Ipsilateral',
  pearl: nerve.clinicalPearl,
  nuclei: nerve.nuclei,
  toneEffect: nerve.toneEffect,
  videoUrl: nerve.videoUrl,
  pageUrl: nerve.pageUrl
}));

export const BRAIN_REFLEX_POINTS: BrainReflexPoint[] = [
  ...CORTICAL_POINTS,
  ...SUBCORTICAL_POINTS,
  ...MAPPED_CRANIAL_NERVES
];