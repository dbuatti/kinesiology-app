
export type BrainstemNuclei = 'Cortex' | 'Midbrain' | 'Pons' | 'Medulla';
export type MotorToneEffect = 'Flexors' | 'Extensors' | 'None';

export interface CranialNerve {
  id: number;
  name: string;
  latinName: string;
  nuclei: BrainstemNuclei;
  toneEffect: MotorToneEffect;
  reflexPoint: string;
  functions: string[];
  stimulus: string;
  clinicalPearl: string;
  color: string;
  acupoint?: string;
  videoUrl?: string;
  pageUrl?: string;
  delineationGuide?: string;
  isLateralized?: boolean;
  dysfunctionConsequences?: string;
  assessmentProtocol?: string;
}

export const BRAINSTEM_KEYS: Record<BrainstemNuclei, { description: string; stim: string }> = {
  'Cortex': {
    description: "Project to cortex (olfactory & visual). Not housed in brainstem.",
    stim: "Direct sensory input (Smell/Light)"
  },
  'Midbrain': {
    description: "Eye movement nuclei. Stim: GV26 + clavicle + ear cupping.",
    stim: "GV26 + Clavicle + Ear Cupping"
  },
  'Pons': {
    description: "Facial sensation, eye movement, facial motor, hearing/balance. Stim: GV17 (EOP).",
    stim: "GV17 (EOP)"
  },
  'Medulla': {
    description: "Swallowing, Vagus, Accessory, Tongue. Stim: GB12.",
    stim: "GB12"
  }
};

export const CRANIAL_NERVES: CranialNerve[] = [
  {
    id: 1,
    name: "CN I",
    latinName: "Olfactory",
    nuclei: "Cortex",
    toneEffect: "None",
    acupoint: "Yin Tang",
    reflexPoint: "Yin Tang acupoint — between and just above the eyebrows",
    functions: [
      "Sense of smell (olfaction)",
      "Olfactory memory and emotional memory recall",
      "Direct limbic system connection (bypasses thalamus)",
      "Appetite and food recognition"
    ],
    stimulus: "Smell an essential oil in the nostril. CN I bypasses the thalamus entirely and projects directly to the olfactory cortex and limbic system.",
    clinicalPearl: "CN I is the only cranial nerve that bypasses the thalamus and projects directly to the limbic system — making it a powerful emotional and memory pathway. Olfactory dysfunction is common in post-concussion, post-viral, and neurodegenerative presentations. Olfactory stim can be used as a limbic entry point when direct emotional work is blocked.",
    color: "bg-purple-50",
    isLateralized: true,
    dysfunctionConsequences: "CN I dysfunction disrupts the direct limbic connection, leading to emotional blunting, impaired autobiographical memory, and reduced capacity for emotional regulation. Because CN I bypasses the thalamus, olfactory loss can disconnect the patient from emotionally-anchored memories and safety cues. In post-viral and post-concussion presentations, anosmia is often an early marker of limbic dysregulation. Clinically, this can manifest as flat affect, anhedonia, poor stress resilience, and difficulty with emotional processing — all of which are commonly misattributed to psychological causes rather than neurological ones.",
    assessmentProtocol: "Hold Yin Tang (between and just above eyebrows) as the reflex point. Stimulus: smell an essential oil in the nostril. CN I bypasses the thalamus entirely and projects directly to the olfactory cortex and limbic system.",
    videoUrl: "https://embed-ssl.wistia.com/deliveries/d2a02ad26550033565f709c63fa2d85a18ff2c5d.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167205372"
  },
  {
    id: 2,
    name: "CN II",
    latinName: "Optic",
    nuclei: "Cortex",
    toneEffect: "None",
    acupoint: "BL2",
    reflexPoint: "Bladder 2 (BL2) acupoint — inner end of eyebrow, above inner canthus",
    functions: [
      "Vision and visual processing",
      "Depth perception and spatial awareness",
      "Light sensitivity regulation (pupillary reflex via CN III)",
      "Visual field mapping"
    ],
    stimulus: "Shine light into the eye in any possible direction — direct, from above, from below, from the sides. Input crosses over at the optic chiasm — right eye projects to left occipital cortex.",
    clinicalPearl: "CN II stim and visual cortex stim are the same thing. Input decussates (crosses over) at the optic chiasm — right visual field → left occipital cortex. In post-concussion presentations, CN II dysfunction is often the primary driver of light sensitivity and cognitive fatigue. BL2 (inner end of eyebrow) is the reflex point; the stim is light directed into the eye from any angle.",
    color: "bg-purple-600",
    isLateralized: true,
    dysfunctionConsequences: "CN II dysfunction is one of the most common drivers of post-concussion symptom burden. Light sensitivity (photophobia) and visual fatigue are hallmark signs — the brain cannot modulate incoming visual input, leading to rapid cognitive overload in bright or busy environments. Decussation at the optic chiasm means a right-sided lesion affects the left visual field of both eyes, which can be missed unless specifically tested. Chronic CN II dysfunction contributes to headaches, reading difficulties, poor depth perception, and avoidance of visually demanding environments. In FNH, CN II and the visual cortex are treated as the same pathway.",
    assessmentProtocol: "Hold BL2 (inner end of eyebrow) as the reflex point. Stimulus: shine light into the eye in any possible direction — direct, from above, from below, from the sides. Input crosses over at the optic chiasm — right eye projects to left occipital cortex.",
    videoUrl: "https://embed-ssl.wistia.com/deliveries/b874823f0dc614160512b66bcb5b516f50f9eb2d.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167779783"
  },
  {
    id: 3,
    name: "CN III",
    latinName: "Oculomotor",
    nuclei: "Midbrain",
    toneEffect: "Flexors",
    reflexPoint: "Lightly touch the eye lids",
    functions: [
      "Eye movement: up, down, and medial gaze",
      "Pupil constriction (parasympathetic)",
      "Eyelid elevation (levator palpebrae)",
      "Lens accommodation (near focus)"
    ],
    stimulus: "Move eyes up, down, medial towards bridge of nose, up and left, down and left, open eyelid slowly. Shares midbrain housing with CN IV.",
    clinicalPearl: "CN III shares midbrain nuclei with CN IV. Midbrain stim (GV26 + clavicle + ear cupping) addresses both simultaneously. Ptosis and pupil asymmetry are red flags — rule out structural causes before applying stim. In FNH, CN III dysfunction often presents alongside CN IV and is addressed as a midbrain complex.",
    color: "bg-amber-500",
    isLateralized: true,
    dysfunctionConsequences: "CN III dysfunction causes ptosis (drooping eyelid) and a characteristic 'down and out' eye position due to unopposed action of CN IV and CN VI. Pupil dilation (mydriasis) and loss of accommodation impair near vision and light adaptation. In FNH clinical practice, CN III dysfunction is a common finding in post-concussion presentations — even subtle asymmetry in eyelid height or pupil response is clinically significant. Because CN III shares midbrain housing with CN IV, dysfunction in one is often accompanied by the other. Midbrain dysregulation also affects arousal, alertness, and the dopaminergic reward system.",
    assessmentProtocol: "Lightly touch the eye lids as the reflex point. Stimulus: move eyes up, down, medial towards bridge of nose, up and left, down and left, open eyelid slowly. Shares midbrain housing with CN IV.",
    videoUrl: "https://embed-ssl.wistia.com/deliveries/e469a668620604adbb0a0c69a192e7af50579078.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167779787"
  },
  {
    id: 4,
    name: "CN IV",
    latinName: "Trochlear",
    nuclei: "Midbrain",
    toneEffect: "Flexors",
    reflexPoint: "Lightly touch the eyes",
    functions: [
      "Downward and inward eye movement (superior oblique muscle)",
      "Stabilises eye during head tilt",
      "Critical for reading and descending stairs"
    ],
    stimulus: "Move eyes towards the tip of the nose (downward and inward convergence). CN IV is the only cranial nerve that exits dorsally from the brainstem.",
    clinicalPearl: "CN IV is the smallest cranial nerve and the only one to exit dorsally. It is frequently overlooked clinically. Unexplained head tilt — especially in children — is a classic CN IV presentation. Midbrain stim (GV26) addresses CN III and IV together. Always check for compensatory head tilt as a diagnostic clue.",
    color: "bg-amber-600",
    isLateralized: true,
    dysfunctionConsequences: "CN IV dysfunction is frequently missed because its presentation is subtle — a compensatory head tilt is often the only visible sign, and patients often cannot articulate why they tilt. The inability to look downward and inward makes descending stairs, reading, and close-up work difficult and fatiguing. Vertical diplopia (double vision looking down) is the hallmark symptom. In children, unexplained chronic head tilt should always prompt CN IV assessment before assuming a musculoskeletal cause. Because CN IV exits dorsally and is the longest intracranial course of any cranial nerve, it is disproportionately vulnerable to traumatic brain injury.",
    assessmentProtocol: "Lightly touch the eyes as the reflex point. Stimulus: move eyes towards the tip of the nose (downward and inward convergence). CN IV is the only cranial nerve that exits dorsally from the brainstem.",
    videoUrl: "https://embed-ssl.wistia.com/deliveries/e469a668620604adbb0a0c69a192e7af50579078.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167779806"
  },
  {
    id: 5,
    name: "CN V",
    latinName: "Trigeminal",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Hand across the mandible (cheek)",
    functions: [
      "Facial sensation — three branches: V1 ophthalmic (forehead), V2 maxillary (cheek), V3 mandibular (jaw)",
      "Jaw movement and mastication (motor division)",
      "Corneal reflex (V1 afferent limb)",
      "Largest cranial nerve by volume"
    ],
    stimulus: "Targeted stimulation of each branch: V1 — light touch to the forehead and supraorbital region. V2 — light touch to the cheek and upper lip. V3 — light touch to the jaw and lower lip, plus jaw clenching (masseter) and lateral jaw movement (pterygoids). Very light sound stimulus (soft click or gentle tone) for the tensor tympani branch.",
    clinicalPearl: "CN V is the largest cranial nerve and the primary sensory nerve of the face. GV26 → trigeminal nucleus → midbrain is a key pathway. Pons correction (GV17/EOP) is the primary stim for the CN V–VIII group. TMJ dysfunction and chronic headaches are common presentations of CN V involvement in FNH practice.",
    color: "bg-indigo-500",
    isLateralized: true,
    delineationGuide: "V1 — Ophthalmic Branch: Light touch to the forehead and supraorbital region. Covers the scalp, forehead, upper eyelid, and cornea. Corneal reflex uses V1 as the afferent limb.\n\nV2 — Maxillary Branch: Light touch to the cheek, lower eyelid, upper lip, and lateral nose. Covers the maxillary sinus region and upper teeth.\n\nV3 — Mandibular Branch: Light touch to the jaw, lower lip, chin, and anterior ear. Also the motor root — jaw clenching and lateral jaw movement test the masseter and pterygoid muscles.\n\nTensor Tympani (Motor): Very light sound stimulus (soft click or gentle tone) to activate the tensor tympani muscle in the middle ear. Dampens low-frequency sounds and is involved in the acoustic startle reflex.",
    dysfunctionConsequences: "CN V dysfunction has wide-ranging consequences because it is the primary sensory nerve of the entire face. Trigeminal neuralgia — one of the most severe pain conditions known — is a direct consequence of CN V irritation. TMJ dysfunction, chronic jaw pain, and bruxism are common FNH presentations linked to CN V motor division compromise. Facial numbness or altered sensation affects proprioception of the face, which disrupts spatial orientation and can contribute to dizziness and postural instability. The tensor tympani branch (V3 motor) modulates sound sensitivity — CN V dysfunction can therefore contribute to hyperacusis and auditory overwhelm, often misattributed to CN VIII alone.",
    assessmentProtocol: "Place hand across the mandible (cheek) as the reflex point. CN V has three sensory branches and a motor division — each requires targeted stimulation.",
    videoUrl: "https://embed-ssl.wistia.com/deliveries/10de3ccab10de3ccab1d8595c4c3e451aea5b91c84cf6213f.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167780073"
  },
  {
    id: 6,
    name: "CN VI",
    latinName: "Abducens",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Lightly touch the eyes",
    functions: [
      "Lateral eye movement — abduction (looking outward away from midline)",
      "Coordinates with CN III for conjugate gaze"
    ],
    stimulus: "Move eyes laterally — look as far left as possible, then as far right as possible. Tests the lateral rectus muscle (sole muscle innervated by CN VI).",
    clinicalPearl: "CN VI palsy is a well-known sign of raised intracranial pressure and is often the first cranial nerve affected in post-concussion presentations. Pons stim (GV17) addresses CN V–VIII together. Horizontal diplopia that worsens at distance is a classic CN VI presentation.",
    color: "bg-indigo-600",
    isLateralized: true,
    dysfunctionConsequences: "CN VI dysfunction prevents lateral eye movement, causing the affected eye to turn inward (esotropia) and producing horizontal diplopia that worsens at distance. This forces the patient to turn their head toward the affected side to compensate — a pattern that is commonly mistaken for a neck or vestibular problem. CN VI has the longest intracranial course after CN IV, making it highly sensitive to raised intracranial pressure and traumatic injury. In post-concussion presentations, CN VI dysfunction is often the first cranial nerve to be affected and is a key driver of reading difficulty, screen fatigue, and spatial disorientation. Pons dysregulation affects CN V–VIII simultaneously.",
    assessmentProtocol: "Lightly touch the eyes as the reflex point. Stimulus: move eyes laterally — look as far left as possible, then as far right as possible. Tests the lateral rectus muscle (sole muscle innervated by CN VI).",
    videoUrl: "https://embed-ssl.wistia.com/deliveries/e469a668620604adbb0a0c69a192e7af50579078.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167780077"
  },
  {
    id: 7,
    name: "CN VII",
    latinName: "Facial",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Hand along the temporal / TMJ area",
    functions: [
      "Facial expression (motor — all muscles of facial expression)",
      "Taste — anterior 2/3 of tongue",
      "Lacrimation (tear production) and salivation (submandibular/sublingual glands)",
      "Stapedius muscle — sound dampening in middle ear"
    ],
    stimulus: "Squeeze eye shut, produce different facial expressions, loud sound stimulus (activates the stapedius branch). Test facial symmetry and expression quality before and after.",
    clinicalPearl: "CN VII has both motor and sensory divisions. The stapedius branch is clinically significant — CN VII dysfunction can cause hyperacusis (sound hypersensitivity), which is common in post-concussion and stress presentations. Pons stim (GV17/EOP) is the primary correction. Bell's palsy is the classic CN VII presentation.",
    color: "bg-indigo-700",
    isLateralized: true,
    dysfunctionConsequences: "CN VII dysfunction has both functional and psychosocial consequences. Facial asymmetry (Bell's palsy pattern) impairs non-verbal communication and social engagement — patients often report feeling socially withdrawn or misread by others. The stapedius branch is clinically critical: CN VII dysfunction causes hyperacusis (sound hypersensitivity), which is a significant driver of sensory overwhelm, anxiety, and avoidance behaviour in post-concussion and stress presentations. Dry eye on the affected side (lacrimal branch) causes chronic eye discomfort and visual fatigue. Loss of taste on the anterior tongue affects appetite, eating behaviour, and quality of life. CN VII dysfunction is also a key driver of jaw and TMJ dysfunction via the chorda tympani branch.",
    assessmentProtocol: "Place hand along the temporal/TMJ area as the reflex point. Stimulus: squeeze eye shut, produce different facial expressions, loud sound stimulus (activates the stapedius branch). Test facial symmetry and expression quality before and after.",
    videoUrl: "https://embed-ssl.wistia.com/deliveries/e80792dddb73e4f494dd7f56a6cb1958e571e5ae.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167780903"
  },
  {
    id: 8,
    name: "CN VIII",
    latinName: "Vestibulocochlear",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Finger in the ear canal",
    functions: [
      "Hearing — cochlear division (sound transduction)",
      "Balance and spatial orientation — vestibular division",
      "Vestibulo-ocular reflex (gaze stabilisation during head movement)",
      "Projects to cerebellum (vestibular division) and temporal lobe (cochlear division)"
    ],
    stimulus: "Cochlear (Auditory) Stim: click fingers next to the ear (auditory input to the cochlear division). Vestibular Stim: move head in different directions — rotate left, rotate right, tilt left, tilt right, up, down.",
    clinicalPearl: "Auditory cortex stim and CN VIII stim are the same intervention. The vestibular division projects heavily to the cerebellum — CN VIII dysfunction frequently presents alongside cerebellar signs (balance, coordination). Tinnitus, vertigo, and motion sickness are common FNH presentations. Pons stim (GV17) + rocking/vestibular input is the standard protocol.",
    color: "bg-indigo-800",
    isLateralized: true,
    delineationGuide: "Cochlear (Auditory) Stim: Click fingers next to the ear (auditory input to the cochlear division — projects to the auditory cortex in the temporal lobe).\n\nVestibular Stim: Move head in different directions: rotate left, rotate right, tilt left, tilt right, up, down (vestibular input — projects to the cerebellum and brainstem for balance and gaze stabilisation).",
    dysfunctionConsequences: "CN VIII dysfunction affects two distinct systems with overlapping but distinct consequences. Cochlear division dysfunction causes tinnitus, sensorineural hearing loss, and auditory processing difficulties — patients struggle to filter background noise, follow conversations, and process auditory information under cognitive load. Vestibular division dysfunction is one of the most disabling consequences: vertigo, dizziness, motion sickness, and chronic postural instability affect every aspect of daily function. The vestibulo-ocular reflex (VOR) is disrupted, causing gaze instability during head movement — a key driver of nausea, spatial disorientation, and reading difficulty. Vestibular dysfunction is strongly linked to cerebellar dysregulation and is a common finding in post-concussion, anxiety, and chronic fatigue presentations.",
    assessmentProtocol: "Place finger in the ear canal as the reflex point. CN VIII has two distinct divisions requiring separate stimulation techniques. Cochlear: Click fingers next to the ear. Vestibular: Move head in 6 directions (rotate L/R, tilt L/R, up, down).",
    videoUrl: "https://embed-ssl.wistia.com/deliveries/465c56ed15ec74012154656cd87ff84d9307a40c.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167780911"
  },
  {
    id: 9,
    name: "CN IX",
    latinName: "Glossopharyngeal",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    acupoint: "GB21",
    reflexPoint: "GB21 acupoint — halfway between the neck and shoulder tip, in the belly of the Upper Trapezius",
    functions: [
      "Taste — posterior 1/3 of tongue",
      "Swallowing — pharyngeal phase (nucleus ambiguus)",
      "Carotid body/sinus monitoring (blood pressure and O2 levels)",
      "Parotid gland salivation"
    ],
    stimulus: "Humming or swallowing. Test indicator muscle before and after to assess CN IX function.",
    clinicalPearl: "CN IX and CN X share medullary nuclei (nucleus ambiguus and nucleus solitarius). GB12 is the primary medulla stim point for the CN IX–XII group. Carotid sinus hypersensitivity (CN IX) can present as unexplained syncope or dizziness with neck pressure. Always assess CN IX and X together.",
    color: "bg-rose-50",
    isLateralized: false,
    dysfunctionConsequences: "CN IX dysfunction disrupts the pharyngeal phase of swallowing, causing dysphagia that is often silent (no coughing) and therefore underdiagnosed. Loss of taste on the posterior tongue affects appetite and nutritional intake. The carotid sinus branch monitors blood pressure and oxygen levels — CN IX dysfunction can cause carotid sinus hypersensitivity, presenting as unexplained syncope, dizziness, or drop attacks triggered by neck pressure (tight collars, turning the head). Because CN IX and CN X share medullary nuclei, dysfunction in one is almost always accompanied by some degree of the other — a combined CN IX/X assessment is standard FNH practice.",
    assessmentProtocol: "Hold GB21 (halfway between the neck and shoulder tip, in the belly of the Upper Trapezius) as the reflex point. Stimulus: humming or swallowing. Test indicator muscle before and after to assess CN IX function.",
    videoUrl: "https://embed-ssl.wistia.com/deliveries/c951c07cedadced7e1d2291c60a8dc22d90ac90a.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167780916"
  },
  {
    id: 10,
    name: "CN X",
    latinName: "Vagus",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Flat hand across the Occiput-Atlas joint (base of skull / C1 junction)",
    functions: [
      "Parasympathetic regulation of heart, lungs, and gut (visceral organs)",
      "Swallowing, voice, and gag reflex (motor — nucleus ambiguus)",
      "Gut-brain axis — bidirectional communication",
      "Heart rate variability (HRV) — ventral vagal tone"
    ],
    stimulus: "Use the Cymba Concha auricular point (the upper hollow of the ear bowl, above the Concha Cavum, below the antihelix — Auricular Branch of the Vagus Nerve) to lateralise — right Cymba Concha for right vagus, left for left. Stimulus options: humming, swallowing, 'Aaah' vocalisation, clean roof of mouth with tongue, slow heart rate breathing (extended exhale).",
    clinicalPearl: "CN X is the most clinically significant cranial nerve in FNH. Critically: ~90% of CN X fibres are AFFERENT — they carry sensory information from the visceral organs (heart, lungs, gut) UP to the Nucleus Tractus Solitarius (NTS) in the medulla. This means organ dysfunction (digestive, cardiac, respiratory) often presents as an AFFERENT correction need, not efferent. Dorsal vagal shutdown = freeze/collapse/dissociation. Ventral vagal = safe, connected, regulated. GB12 + humming is a powerful vagal reset. The PRE slow exhale test directly assesses vagal tone and is both a diagnostic and therapeutic tool.",
    color: "bg-rose-600",
    isLateralized: false,
    dysfunctionConsequences: "CN X dysfunction is arguably the most systemically consequential of all cranial nerve dysfunctions in FNH practice. Because ~90% of vagal fibres are afferent (carrying organ status signals to the NTS), dysfunction means the brain loses accurate real-time information from the heart, lungs, and gut — leading to dysautonomia, poor autonomic regulation, and a chronic threat state. Dorsal vagal shutdown produces the freeze/collapse/dissociation response: fatigue, emotional numbness, digestive shutdown, and social withdrawal. Low heart rate variability (HRV) is both a consequence and a measurable marker of CN X dysfunction. Digestive dysfunction (bloating, gastroparesis, constipation, IBS-pattern symptoms) is a direct consequence of impaired vagal tone to the enteric nervous system. Voice changes (hoarse, weak, breathy) and swallowing difficulties are motor consequences via the nucleus ambiguus.",
    assessmentProtocol: "Place flat hand across the Occiput-Atlas joint (base of skull / C1 junction) as the reflex point. Use the Cymba Concha auricular point (the upper hollow of the ear bowl) to lateralise — right Cymba Concha for right vagus, left for left. Stimulus: humming, swallowing, 'Aaah' vocalisation, clean roof of mouth with tongue, slow heart rate breathing.",
    videoUrl: "https://embed-ssl.wistia.com/deliveries/347fefe7d351b6760c82e9cc68a47d37b0d53906.mp4",
    pageUrl: "https://functional-neuro-health.notion.site/Functional-Neuro-Health-The-PEACE-Method-28beacafb4a88026b9a9ccdefa4e1de9"
  },
  {
    id: 11,
    name: "CN XI",
    latinName: "Accessory (Spinal)",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Bilateral Posterior Ramus of Jaw (both sides of the posterior jaw)",
    functions: [
      "Motor to SCM — head rotation and lateral flexion",
      "Motor to upper trapezius — shoulder elevation and scapular stabilisation",
      "Dual origin: medulla + upper cervical cord (C1–C5)"
    ],
    stimulus: "Ipsilateral SCM contraction + contralateral upper trapezius contraction. Test SCM and upper trapezius strength as indicator muscles before and after.",
    clinicalPearl: "CN XI is the only cranial nerve with dual origin (brainstem + spinal cord). SCM weakness is a common finding in post-concussion, whiplash, and chronic neck pain presentations. GB12 is the medulla correction point. Upper trapezius inhibition (not just tension) is a key diagnostic finding — test it as an IM. GB21 (trapezius belly) can also be used as a touch point for the trapezius division.",
    color: "bg-rose-700",
    isLateralized: true,
    delineationGuide: "To delineate: 1. Hold reflex point (jaw). 2. Test shoulder shrug only (Trapezius) → if IM inhibits, it's a Trapezius priority. 3. Test head rotation only (SCM) → if IM inhibits, it's an SCM priority.",
    dysfunctionConsequences: "CN XI dysfunction directly impairs the SCM and upper trapezius — two of the most clinically significant muscles in FNH practice. SCM weakness causes difficulty rotating the head, poor cervical proprioception, and contributes to chronic neck pain and postural instability. Upper trapezius inhibition (not tension — inhibition) is a key finding: the muscle appears tight but tests weak, and is a common driver of shoulder dysfunction, scapular instability, and upper thoracic pain. Torticollis (wry neck) is a classic CN XI presentation. Because CN XI has dual origin from both the medulla and the upper cervical cord (C1–C5), it sits at the intersection of cranial nerve and spinal nerve assessment — making it a critical bridge between the two systems in FNH.",
    assessmentProtocol: "Hold the bilateral posterior ramus of the jaw (both sides simultaneously) as the reflex point. Stimulus: ipsilateral SCM contraction + contralateral upper trapezius contraction. Test SCM and upper trapezius strength as indicator muscles before and after.",
    videoUrl: "https://embed-ssl.wistia.com/deliveries/8dc68372fa942300d450b03ec8487454cacb02c7.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166647725"
  },
  {
    id: 12,
    name: "CN XII",
    latinName: "Hypoglossal",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Sulcus under chin — anterior mandible (groove between chin and lower lip)",
    functions: [
      "Tongue movement — all intrinsic and most extrinsic tongue muscles",
      "Speech articulation (dysarthria when dysfunctional)",
      "Swallowing — oral phase (tongue propulsion of bolus)",
      "Tongue posture and resting position"
    ],
    stimulus: "Tongue movement — forwards, right, left, up, and any other direction. Test tongue strength and deviation on protrusion before and after.",
    clinicalPearl: "Tongue deviation on protrusion is a key diagnostic sign — the tongue deviates toward the ipsilateral (same side as lesion) weak side. CN XII dysfunction is a common finding in post-stroke, post-concussion, and speech/swallowing presentations. GB12 medulla correction + tongue exercises is the standard protocol. Articulation quality is a useful functional re-test after correction.",
    color: "bg-rose-800",
    isLateralized: false,
    dysfunctionConsequences: "CN XII dysfunction affects every function that depends on precise tongue movement — speech, swallowing, and oral motor control. Dysarthria (slurred or imprecise speech) is a direct consequence, affecting communication and social confidence. Dysphagia in the oral phase means difficulty propelling food and liquid to the back of the throat, increasing aspiration risk. Tongue deviation on protrusion (toward the weak/lesion side) is a reliable and easily observable diagnostic sign. In post-stroke presentations, CN XII dysfunction is almost universal. In FNH practice, subtle CN XII dysfunction is commonly found in post-concussion, speech delay, and chronic swallowing difficulty presentations — and is frequently overlooked because tongue assessment is not routine in most clinical settings.",
    assessmentProtocol: "Hold the sulcus under the chin (anterior mandible) as the reflex point. Stimulus: tongue movement — forwards, right, left, up, and any other direction. Test tongue strength and deviation on protrusion before and after.",
    videoUrl: "https://embed-ssl.wistia.com/deliveries/c951c07cedadced7e1d2291c60a8dc22d90ac90a.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167780916"
  }
];
