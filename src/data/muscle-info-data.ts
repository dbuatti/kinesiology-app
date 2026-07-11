
export interface MuscleInfo {
  name: string;
  brainstemControl?: string;
  clinicalIndications?: string;
  function?: string;
  kineticChain?: string;
  ligamentsJoints?: string;
  meridian?: string;
  myotome?: string;
  nerveSupply?: string;
  nutrition?: string;
  organGland?: string;
  sedationPoints?: string;
  spinalFixation?: string;
  testingPosition?: string;
  neurolymphatic?: string;
  neurovascular?: string;
  description?: string;
  videoUrl?: string;
  pageUrl?: string;
  pearl?: string;
}

export const MUSCLE_INFO_DETAILS: Record<string, MuscleInfo> = {
  'Sternocleidomastoid (SCM)': {
    name: 'Sternocleidomastoid (SCM)',
    brainstemControl: 'Medulla (CN XI)',
    clinicalIndications: 'Neck pain, headaches, torticollis, balance issues, visual tracking difficulties.',
    function: 'Flexes the neck, rotates head to opposite side, tilts head to same side.',
    meridian: 'Stomach',
    myotome: 'C2, C3',
    nerveSupply: 'Accessory Nerve (CN XI) and C2-C3 spinal nerves',
    organGland: 'Sinuses / Stomach',
    spinalFixation: 'C2-C3',
    testingPosition: 'Client supine. Drop the head down (flexion) and rotate the head away from the side being tested. Practitioner applies pressure to the temporal area, pushing the head back towards the table and into rotation.',
    pearl: 'After testing, "squeeze through here" (the muscle belly and associated NL points) to check for immediate neurological shift or tenderness.',
    description: 'A key muscle for head orientation and a major player in the Medulla-driven flexor tone chain.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/37764185e445a8aed45bc5ac5ffbd5108b075252.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167833423"
  },
  'Upper Trapezius': {
    name: 'Upper Trapezius',
    brainstemControl: 'Medulla (CN XI)',
    clinicalIndications: 'Shoulder tension, "carrying the weight of the world", shallow breathing, neck stiffness.',
    function: 'Elevates the scapula, rotates the head to the opposite side.',
    meridian: 'Lung',
    myotome: 'C3, C4',
    nerveSupply: 'Accessory Nerve (CN XI) and C3-C4 spinal nerves',
    organGland: 'Lung / Eyes',
    spinalFixation: 'C3-C4',
    testingPosition: 'Client seated. Bring the head into slight extension, rotate the head away from the side being tested, drop the head further back into extension, and elevate the shoulder. Practitioner pulls the shoulder down and the head in the opposite direction. Alternate vertical lift: lift the shoulder girdle vertically and test for lock.',
    pearl: 'The alternate vertical lift method allows you to test the Upper Trapezius "like an indicator" to check general system integrity.',
    description: 'The primary "stress" muscle. Closely linked to the Lung meridian and the body\'s ability to take in Qi and release grief.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/37764185e445a8aed45bc5ac5ffbd5108b075252.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167833423"
  },
  'Psoas': {
    name: 'Psoas',
    brainstemControl: 'Medulla, Midbrain',
    clinicalIndications: 'Lower back pain, hip instability, shallow breathing, fear/anxiety patterns.',
    function: 'Hip flexion, trunk rotation, stabilizes lumbar spine.',
    meridian: 'Kidney',
    myotome: 'L2, L3',
    nerveSupply: 'Lumbar Plexus (L1-L3)',
    organGland: 'Kidney',
    spinalFixation: 'T10-T1',
    testingPosition: 'Client supine, leg flexed to 45°, abducted and externally rotated. Pressure applied into extension and slight adduction. The higher the leg position, the more iliacus is tested; lower positions target more psoas fibers. Also testable seated with hip flexion against resistance.',
    description: 'The "Muscle of the Soul". Deeply connected to the fight-or-flight response and diaphragmatic breathing.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/364abce3a360a7845926d9d775c0b462.mp4"
  },
  'Gluteus Medius': {
    name: 'Gluteus Medius',
    brainstemControl: 'Pons, Cerebellum',
    clinicalIndications: 'Trendelenburg gait, lateral knee pain, pelvic instability.',
    function: 'Hip abduction, stabilizes pelvis during gait.',
    meridian: 'Pericardium',
    myotome: 'L5',
    nerveSupply: 'Superior Gluteal Nerve (L4-S1)',
    organGland: 'Reproductive Organs',
    spinalFixation: 'L5-S1',
    description: 'Primary lateral stabilizer of the pelvis. Essential for efficient walking and running mechanics.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/31d6aeb20c5938a0b44f3dddbb8c954df877f43b.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167833410"
  },
  'Supraspinatus': {
    name: 'Supraspinatus',
    brainstemControl: 'Pons, Cerebellum',
    clinicalIndications: 'Shoulder impingement, difficulty lifting arm, brain fog, thyroid issues.',
    function: 'Initiates shoulder abduction, stabilizes GH joint.',
    meridian: 'Central',
    myotome: 'C5',
    nerveSupply: 'Suprascapular Nerve (C5-C6)',
    organGland: 'Brain / Thyroid',
    spinalFixation: 'C7-T11',
    description: 'The "Starter" muscle of the shoulder. Often the first muscle to inhibit under general neurological threat.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/8dc68372fa942300d450b03ec8487454cacb02c7.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166647725"
  },
  'Latissimus Dorsi': {
    name: 'Latissimus Dorsi',
    brainstemControl: 'Pons, Cerebellum',
    clinicalIndications: 'Mid-back pain, shoulder internal rotation issues, blood sugar swings.',
    function: 'Shoulder extension, adduction, and internal rotation.',
    meridian: 'Spleen',
    myotome: 'C6, C7, C8',
    nerveSupply: 'Thoracodorsal Nerve',
    organGland: 'Pancreas / Spleen',
    spinalFixation: 'T4-T7',
    description: 'The largest muscle of the upper body. Key indicator for metabolic and digestive stress.'
  },
  'Transverse Abdominals': {
    name: 'Transverse Abdominals',
    meridian: 'Stomach',
    testingPosition: 'Client supine, knees bent. Lift head and shoulders slightly while keeping the ribcage neutral (no side bending or rotation). Practitioner applies light pressure straight across the abdomen, not through the ribs. Also testable seated with a straight cross-body pressure.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/9b588212f338df39c1aaa347a5b143009e2bb547.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166239953"
  },
  'Diaphragm': {
    name: 'Diaphragm',
    meridian: 'Pericardium',
    testingPosition: 'Client seated or supine. Inhale deeply while practitioner applies gentle pressure to the lower ribcage. Test bilaterally. A strong inhalation with full ribcage expansion indicates normal function.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/9813e62a13a7ef09e17f7a16e5ca810b096b5ed2.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167833384"
  },
  'Multifidi': {
    name: 'Multifidi',
    meridian: 'Bladder',
    testingPosition: 'Client prone. Rotate both feet outward. Practitioner pulls straight up on the pelvis (ilion). Client resists. Alternatively, client lifts opposite arm and leg while practitioner tests the spinal extensors.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/2630882e5679cf0ec3b82ea50047b8490aeebf16.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167418078"
  },
  'Sacrospinalis': {
    name: 'Sacrospinalis',
    meridian: 'Bladder',
    testingPosition: 'Client prone, lifting the upper body. Also testable seated: client leans forward with nose down, practitioner applies pressure through the upper back. Nose up variant tests the opposite fiber group.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/67f55210add07eaec9dbcde9a093d5e8589d3a37.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167833389"
  },
  'Quadriceps Group': {
    name: 'Quadriceps Group',
    meridian: 'Stomach',
    testingPosition: 'Client supine, leg extended. Practitioner applies pressure into flexion.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/84a671ca73575c93a18cb9a867c0670c8cb4ea63.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166288733"
  },
  'Biceps': {
    name: 'Biceps',
    meridian: 'Stomach',
    testingPosition: 'Elbow flexion with supination. Short head: more direct flexion resistance. Long head: abduct the arm slightly and apply extension pressure at the elbow to target the biarticular fibers.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/006270ae8c685161a8a2c55053ee0fd5ecf69b18.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167503394"
  },
  'Triceps': {
    name: 'Triceps',
    meridian: 'Small Intestine',
    testingPosition: 'Elbow extension. Long head: arm at the side, elbow flexed, client extends against resistance. Short head: arm slightly abducted, more direct extension pressure through the forearm.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/006270ae8c685161a8a2c55053ee0fd5ecf69b18.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167503394"
  },
  'Pelvic Floor (Anterior)': {
    name: 'Pelvic Floor (Anterior)',
    meridian: 'Bladder',
    testingPosition: 'Client supine, knees bent. "Hold back urine" to engage the anterior pelvic floor. Practitioner can test bilaterally or isolate left/right by asking the client to focus their awareness. Can be tested via indicator muscle.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/df6e708227eb9ad1433a71387743208c330843c1.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166647569"
  },
  'Pelvic Floor (Posterior)': {
    name: 'Pelvic Floor (Posterior)',
    meridian: 'Bladder',
    testingPosition: 'Client supine, knees bent. "Hold back a bowel movement" to engage the posterior pelvic floor. Common pattern: posterior hypertonic and anterior inhibited, often linked to sacrotuberous ligament mechano-distortion.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/df6e708227eb9ad1433a71387743208c330843c1.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166647569"
  },
  'Serratus Anterior': {
    name: 'Serratus Anterior',
    meridian: 'Pericardium',
    testingPosition: 'Client supine. Arm flexed to 90° with elbow straight. Client punches upward while practitioner applies pressure into extension. Palpate the serrations along the ribcage. Also testable seated with arm forward and pressure through the hand.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/8dc68372fa942300d450b03ec8487454cacb02c7.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166647725"
  },
  'Pectoralis Major (Clavicular)': {
    name: 'Pectoralis Major (Clavicular)',
    meridian: 'Stomach',
    testingPosition: 'Arm flexed to 90°, horizontal adduction.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/8dc68372fa942300d450b03ec8487454cacb02c7.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166647725"
  },
  'Pectoralis Major (Sternal)': {
    name: 'Pectoralis Major (Sternal)',
    meridian: 'Pericardium',
    testingPosition: 'Arm flexed to 120°, horizontal adduction.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/8dc68372fa942300d450b03ec8487454cacb02c7.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166647725"
  },
  'Hamstrings': {
    name: 'Hamstrings',
    meridian: 'Bladder',
    testingPosition: 'Client supine, hip at 90°, knee flexed. Practitioner applies extension pressure through the calcaneus (not the toes — avoid the Achilles mechanoreceptors). To differentiate medial/lateral: rotate the foot outward for medial hamstrings, inward for lateral hamstrings.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/9f0b6c405192834a12a8581540f296ee30a65676.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167833404"
  },
  'Tensor Fasciae Latae (TFL)': {
    name: 'Tensor Fasciae Latae (TFL)',
    meridian: 'Gall Bladder',
    testingPosition: 'Client seated or supine. Slight knee bend, hip abducted and externally rotated. Practitioner applies pressure into adduction. Differentiate from glute medius by the subtle external rotation component. TFL is very commonly dysfunctional.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/3eb66b56dc090f72a7555b8d89b62498930cb6ab.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167833407"
  },
  'Gluteus Maximus': {
    name: 'Gluteus Maximus',
    meridian: 'Bladder',
    testingPosition: 'Client prone, knee bent to 90°. Practitioner applies pressure into flexion. To isolate all fibers of the glute max: rotate the leg slightly, lift, and push toward the opposite knee. Also testable seated: push down through the thigh into extension.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/c1e61933c8f2c127535acf940838eb4765ceb24a.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167833413"
  },
  // Hand Intrinsics
  'Abductor Pollicis Brevis': {
    name: 'Abductor Pollicis Brevis',
    brainstemControl: 'Medulla',
    meridian: 'Lung',
    myotome: 'C8, T1',
    nerveSupply: 'Median Nerve (C8-T1)',
    testingPosition: 'Thumb abduction against resistance in the plane of the palm.',
    description: 'Thenar muscle innervated by the median nerve. Key indicator for lower brachial plexus and cervical nerve root C8-T1 function.'
  },
  'Opponens Pollicis': {
    name: 'Opponens Pollicis',
    brainstemControl: 'Medulla',
    meridian: 'Pericardium',
    myotome: 'C8, T1',
    nerveSupply: 'Median Nerve (C8-T1)',
    testingPosition: 'Touch thumb tip to little finger tip while practitioner applies separating force.',
    description: 'Thenar muscle enabling thumb opposition. Essential for precision grip and fine motor control.'
  },
  'Adductor Pollicis': {
    name: 'Adductor Pollicis',
    brainstemControl: 'Medulla',
    meridian: 'Large Intestine',
    myotome: 'C8, T1',
    nerveSupply: 'Ulnar Nerve (C8-T1)',
    testingPosition: 'Adduct the thumb against resistance toward the palm.',
    description: 'Deep thenar muscle innervated by the ulnar nerve. Tests lower brachial plexus integrity.'
  },
  'First Dorsal Interossei': {
    name: 'First Dorsal Interossei',
    brainstemControl: 'Medulla',
    meridian: 'Small Intestine',
    myotome: 'C8, T1',
    nerveSupply: 'Ulnar Nerve (C8-T1)',
    testingPosition: 'Abduct the index finger against resistance.',
    description: 'Key intrinsic hand muscle innervated by the ulnar nerve. Often tested in cervical radiculopathy screening.'
  },
  'Abductor Digiti Minimi': {
    name: 'Abductor Digiti Minimi',
    brainstemControl: 'Medulla',
    meridian: 'Small Intestine',
    myotome: 'C8, T1',
    nerveSupply: 'Ulnar Nerve (C8-T1)',
    testingPosition: 'Abduct the little finger against resistance.',
    description: 'Hypothenar muscle innervated by the ulnar nerve. Tests ulnar nerve function and lower brachial plexus.'
  },
  // Foot Intrinsics
  'Extensor Digitorum Brevis': {
    name: 'Extensor Digitorum Brevis',
    brainstemControl: 'Pons',
    meridian: 'Gall Bladder',
    myotome: 'L5, S1',
    nerveSupply: 'Deep Peroneal Nerve (L5-S1)',
    testingPosition: 'Extend the toes against resistance while stabilising the ankle.',
    description: 'Dorsal foot muscle. Often tested in peroneal nerve and lumbar spine assessments.'
  },
  'Abductor Hallucis': {
    name: 'Abductor Hallucis',
    brainstemControl: 'Medulla',
    meridian: 'Kidney',
    myotome: 'L4, L5, S1, S2, S3',
    nerveSupply: 'Medial Plantar Nerve (L4-S3)',
    testingPosition: 'Abduct the great toe against resistance.',
    description: 'Medial arch muscle innervated by the medial plantar nerve. Supports foot arch integrity and gait mechanics.'
  },
  'Flexor Digitorum Brevis': {
    name: 'Flexor Digitorum Brevis',
    brainstemControl: 'Medulla',
    meridian: 'Spleen',
    myotome: 'L5, S1',
    nerveSupply: 'Medial Plantar Nerve (L5-S1)',
    testingPosition: 'Flex the lateral four toes at the PIP joints against resistance.',
    description: 'Plantar foot muscle supporting the longitudinal arch. Test of medial plantar nerve function.'
  },
  'Levator Scapula': {
    name: 'Levator Scapula',
    brainstemControl: 'Pons, Cerebellum',
    meridian: 'Gall Bladder',
    myotome: 'C2-C5',
    nerveSupply: 'Dorsal Scapular Nerve (C3-C5)',
    testingPosition: 'Client seated. Rotate head toward the side being tested, then slightly rotate chin away. Elevate the shoulder. Practitioner pushes down on the shoulder and attempts to separate the scapula from the neck.',
    description: 'Elevates the scapula and assists in neck rotation. Attaches from medial border of scapula to C2-C5 transverse processes.'
  },
  'Scalenes': {
    name: 'Scalenes',
    brainstemControl: 'Medulla',
    meridian: 'Large Intestine',
    myotome: 'C3-C7',
    nerveSupply: 'Cervical Plexus (C3-C7)',
    testingPosition: 'Client seated. For anterior scalenes: head slightly extended and rotated away, pressure downward and slightly across. For medial: more lateral pressure. For posterior: pressure over the shoulder toward the opposite hip.',
    description: 'Accessory breathing muscles that elevate the first two ribs. Critical for cervical stability and brachial plexus space.'
  },
  'Neck Extensors': {
    name: 'Neck Extensors',
    brainstemControl: 'Medulla, Midbrain',
    meridian: 'Bladder',
    myotome: 'C1-C8',
    nerveSupply: 'Cervical and Upper Thoracic Spinal Nerves',
    testingPosition: 'Client seated. Drop the head back into extension. Practitioner applies forward pressure. To isolate one side, slightly rotate the head toward that side and apply pressure straight forward.',
    description: 'Group of posterior neck muscles including splenius, semispinalis capitis, and suboccipitals. Critical for head posture and vestibular integration.'
  },
  'Deep Neck Flexors': {
    name: 'Deep Neck Flexors',
    brainstemControl: 'Medulla',
    meridian: 'Stomach',
    myotome: 'C1-C4',
    nerveSupply: 'Cervical Plexus (C1-C4)',
    testingPosition: 'Client seated or supine. Perform a chin nod (not a full head lift). Practitioner applies gentle pressure against the forehead. Differentiate from superficial neck flexors by isolating the nod versus the full head drop.',
    description: 'Longus coli and longus capitis. Deep cervical flexors that stabilize the neck. Chronic inhibition is common in forward-head posture and concussion.'
  },
  'Pec Minor': {
    name: 'Pec Minor',
    brainstemControl: 'Pons, Cerebellum',
    meridian: 'Pericardium',
    myotome: 'C7, C8, T1',
    nerveSupply: 'Medial Pectoral Nerve (C8-T1)',
    testingPosition: 'Client seated. Arm adducted and slightly flexed, reaching toward the opposite hip. Practitioner applies pressure into abduction and extension. Uses a long lever to activate the short strong muscle.',
    description: 'Deep chest muscle that protracts and depresses the scapula. When hypertonic, compresses the brachial plexus, subclavian artery, and lymphatic drainage.'
  },
  'Deltoids (Anterior)': {
    name: 'Deltoids (Anterior)',
    brainstemControl: 'Pons, Cerebellum',
    meridian: 'Stomach',
    myotome: 'C5, C6',
    nerveSupply: 'Axillary Nerve (C5-C6)',
    testingPosition: 'Client seated. Arm flexed forward to 90°, elbow straight. Practitioner applies pressure into extension. For isolated anterior deltoid testing, keep the arm straight as an indicator style test.',
    description: 'Anterior fibers of the deltoid. Primary shoulder flexor and horizontal adductor.'
  },
  'Deltoids (Middle)': {
    name: 'Deltoids (Middle)',
    brainstemControl: 'Pons, Cerebellum',
    meridian: 'Stomach',
    myotome: 'C5, C6',
    nerveSupply: 'Axillary Nerve (C5-C6)',
    testingPosition: 'Client seated. Arm abducted to 90° with elbow straight. Practitioner applies pressure into adduction.',
    description: 'Middle fibers of the deltoid. Primary shoulder abductor.'
  },
  'Deltoids (Posterior)': {
    name: 'Deltoids (Posterior)',
    brainstemControl: 'Pons, Cerebellum',
    meridian: 'Small Intestine',
    myotome: 'C5, C6',
    nerveSupply: 'Axillary Nerve (C5-C6)',
    testingPosition: 'Client seated. Arm extended back with palm down. Practitioner applies pressure forward. Palm-up variant tests more mid-trapezius involvement.',
    description: 'Posterior fibers of the deltoid. Primary shoulder extensor and horizontal abductor.'
  },
  'Middle Trapezius': {
    name: 'Middle Trapezius',
    brainstemControl: 'Medulla (CN XI)',
    meridian: 'Lung',
    myotome: 'C3, C4',
    nerveSupply: 'Accessory Nerve (CN XI) and C3-C4',
    testingPosition: 'Client seated. Arm abducted to 90° with palm up and elbow straight. Practitioner applies pressure forward and across. The palm-up rotation differentiates mid-trap from posterior deltoid.',
    description: 'Middle fibers of the trapezius. Retracts the scapula. Key postural muscle for shoulder girdle stability.'
  },
  'Lower Trapezius': {
    name: 'Lower Trapezius',
    brainstemControl: 'Medulla (CN XI)',
    meridian: 'Pericardium',
    myotome: 'C3, C4',
    nerveSupply: 'Accessory Nerve (CN XI) and C3-C4',
    testingPosition: 'Client seated. Arm raised to approximately 150° in the scapular plane (not full 180°). Practitioner applies pressure forward and downward. Palpate the lower fibers below the scapular spine.',
    description: 'Lower fibers of the trapezius. Depresses and upwardly rotates the scapula. Essential for overhead arm function.'
  },
  'Quadratus Lumborum': {
    name: 'Quadratus Lumborum',
    brainstemControl: 'Pons, Cerebellum',
    meridian: 'Bladder',
    myotome: 'T12-L3',
    nerveSupply: 'Lumbar Plexus (T12-L3)',
    testingPosition: 'Client seated. Side bend away from the side being tested. Practitioner applies pressure through the ribcage into further side bending. Often presents hypertonic. Can also test supine with leg length check.',
    description: 'Deep lateral trunk stabilizer. Connects the iliac crest to the 12th rib and lumbar vertebrae. Chronic hypertonicity drives lower back pain patterns.'
  },
  'Gluteus Minimus': {
    name: 'Gluteus Minimus',
    brainstemControl: 'Pons, Cerebellum',
    meridian: 'Gall Bladder',
    myotome: 'L5',
    nerveSupply: 'Superior Gluteal Nerve (L4-S1)',
    testingPosition: 'Client seated. Leg slightly abducted and internally rotated. Practitioner applies pressure into adduction. Differentiate from glute medius by the internal rotation component.',
    description: 'Deepest of the gluteal muscles. Primary hip abductor and internal rotator.'
  },
  'Piriformis': {
    name: 'Piriformis',
    brainstemControl: 'Pons, Cerebellum',
    meridian: 'Bladder',
    myotome: 'L5, S1, S2',
    nerveSupply: 'Nerve to Piriformis (L5-S2)',
    testingPosition: 'Client seated. Hip externally rotated. Practitioner brings the leg across the midline into adduction. Often hypertonic. Relates to the adrenal medulla indicator pattern.',
    description: 'Deep external rotator of the hip. When hypertonic, compresses the sciatic nerve — a classic driver of posterior hip and buttock pain.'
  },
  'Adductors': {
    name: 'Adductors',
    brainstemControl: 'Pons, Cerebellum',
    meridian: 'Kidney',
    myotome: 'L2-L4',
    nerveSupply: 'Obturator Nerve (L2-L4)',
    testingPosition: 'Client supine, leg slightly abducted. Practitioner applies pressure into further abduction. For gravitational testing: client holds the leg adducted while practitioner pushes outward. Avoid gripping through the Achilles (rich mechanoreceptor).',
    description: 'Medial thigh muscles that adduct the hip. Part of the intrinsic stabilization chain for gait.'
  },
  'Gastrocnemius': {
    name: 'Gastrocnemius',
    brainstemControl: 'Pons, Cerebellum',
    meridian: 'Bladder',
    myotome: 'L5, S1, S2',
    nerveSupply: 'Tibial Nerve (L5-S2)',
    testingPosition: 'Client prone, knee slightly bent (unlocked), foot in neutral. Practitioner applies pressure into dorsiflexion. Be aware of hand position: touching the muscle belly can create a false lock. Test through the forefoot or calcaneus instead.',
    description: 'Primary plantar flexor of the ankle. Crosses the knee joint, so knee position changes the testing length-tension relationship.'
  },
  'Tibialis Anterior': {
    name: 'Tibialis Anterior',
    brainstemControl: 'Pons',
    meridian: 'Stomach',
    myotome: 'L4, L5',
    nerveSupply: 'Deep Peroneal Nerve (L4-S1)',
    testingPosition: 'Client seated or supine. Dorsiflex and invert the foot. Practitioner applies pressure into plantar flexion and eversion.',
    description: 'Primary dorsiflexor of the ankle. Key for gait clearance phase and foot drop assessment.'
  },
  'Tibialis Posterior': {
    name: 'Tibialis Posterior',
    brainstemControl: 'Medulla',
    meridian: 'Kidney',
    myotome: 'L5, S1',
    nerveSupply: 'Tibial Nerve (L5-S1)',
    testingPosition: 'Client seated. Foot in plantar flexion and inversion (point and rotate in). Practitioner applies pressure into eversion. The foot movement involves a swinging arc rather than a straight pull.',
    description: 'Primary inverter and plantar flexor of the ankle. Supports the medial arch. Dysfunction links to flat feet and plantar fasciitis.'
  },
  'Peroneus Longus': {
    name: 'Peroneus Longus',
    brainstemControl: 'Pons',
    meridian: 'Gall Bladder',
    myotome: 'L5, S1',
    nerveSupply: 'Superficial Peroneal Nerve (L4-S1)',
    testingPosition: 'Client seated. Foot in eversion and slight plantar flexion. Practitioner applies pressure into inversion.',
    description: 'Lateral compartment muscle that everts the foot. Essential for lateral ankle stability and gait propulsion.'
  },
  'Flexor Hallucis Longus': {
    name: 'Flexor Hallucis Longus',
    brainstemControl: 'Medulla',
    meridian: 'Kidney',
    myotome: 'L5, S1, S2',
    nerveSupply: 'Tibial Nerve (L5-S2)',
    testingPosition: 'Client seated or supine. Flex the big toe downward. Practitioner pushes the big toe up into extension. Because of the short lever, use minimal pressure.',
    description: 'Deep posterior compartment muscle that flexes the great toe. Deeply linked to foot arch integrity and gait propulsion — the "toe-off" muscle.'
  },
  'Masseter': {
    name: 'Masseter',
    brainstemControl: 'Pons',
    meridian: 'Stomach',
    myotome: 'C5, C6',
    nerveSupply: 'Trigeminal Nerve (CN V)',
    testingPosition: 'Client seated. Bite down. Practitioner can palpate the masseter belly. For indicator testing: have the client bite down on one side, then the other, and test an indicator muscle. Also accessible via direct muscle palpation.',
    description: 'Primary muscle of mastication. Chronic hypertonicity drives TMJ disorders, headaches, and clenching patterns.'
  }
};

export const getMuscleInfo = (name: string): MuscleInfo => {
  const baseName = name.replace(/ \([LR]\)$/, '');
  if (MUSCLE_INFO_DETAILS[baseName]) return MUSCLE_INFO_DETAILS[baseName];
  const foundKey = Object.keys(MUSCLE_INFO_DETAILS).find(k => k.includes(baseName) || baseName.includes(k));
  return foundKey ? MUSCLE_INFO_DETAILS[foundKey] : {
    name: baseName,
    meridian: 'General',
    organGland: 'General',
    testingPosition: '',
    description: 'Clinical details for this muscle are being updated.'
  };
};