"use client";

export interface JointAction {
  label: string;
  howTo: string;
}

export interface JointData {
  name: string;
  type: 'Axial' | 'Appendicular';
  region: 'Upper' | 'Lower';
  pearl: string;
  actions: {
    Sagittal: JointAction[];
    Frontal: JointAction[];
    Transverse: JointAction[];
  };
}

export const JOINT_ACTION_LIBRARY: JointData[] = [
  { 
    name: "Cranium", 
    type: "Axial", 
    region: "Upper",
    pearl: "Organizes the 'Top-Down' neurological tone. Essential for cranial nerve health.",
    actions: {
      Sagittal: [
        { label: "Flexion", howTo: "Tuck the chin towards the chest, lengthening the back of the neck." },
        { label: "Extension", howTo: "Look up towards the ceiling, shortening the back of the neck." }
      ],
      Frontal: [
        { label: "Lateral Flexion", howTo: "Tilt the head to the side, bringing the ear towards the shoulder." }
      ],
      Transverse: [
        { label: "Rotation", howTo: "Turn the head to look over the shoulder." }
      ]
    }
  },
  { 
    name: "Jaw (TMJ)", 
    type: "Axial", 
    region: "Upper",
    pearl: "Deeply connected to the Pelvis and the Vagus nerve (Medulla).",
    actions: {
      Sagittal: [
        { label: "Protrusion", howTo: "Push the lower jaw forward so the bottom teeth are in front of the top." },
        { label: "Retraction", howTo: "Pull the lower jaw back towards the throat." },
        { label: "Opening", howTo: "Drop the jaw down as wide as comfortable." },
        { label: "Closing", howTo: "Bring the teeth together firmly." }
      ],
      Frontal: [
        { label: "Lateral Deviation", howTo: "Shift the lower jaw to the left or right side." }
      ],
      Transverse: [{ label: "-", howTo: "No primary transverse action." }]
    }
  },
  { 
    name: "Cervical Spine", 
    type: "Axial", 
    region: "Upper",
    pearl: "Organizes the head around the horizon. Key for righting reflexes.",
    actions: {
      Sagittal: [
        { label: "Flexion", howTo: "Bend the neck forward, bringing chin to chest." },
        { label: "Extension", howTo: "Tilt the head back to look up." }
      ],
      Frontal: [
        { label: "Lateral Flexion", howTo: "Tilt the neck to the side, ear to shoulder." }
      ],
      Transverse: [
        { label: "Rotation", howTo: "Rotate the neck to look left or right." }
      ]
    }
  },
  { 
    name: "Thoracic Spine", 
    type: "Axial", 
    region: "Upper",
    pearl: "Primary site for rotation. Essential for ribcage mobility and breathing.",
    actions: {
      Sagittal: [
        { label: "Flexion", howTo: "Slump forward, rounding the mid-back." },
        { label: "Extension", howTo: "Lift the chest and arch the mid-back." }
      ],
      Frontal: [
        { label: "Lateral Flexion", howTo: "Lean the torso directly to the side." }
      ],
      Transverse: [
        { label: "Rotation", howTo: "Twist the upper body while keeping the hips facing forward." }
      ]
    }
  },
  { 
    name: "Lumbar Spine", 
    type: "Axial", 
    region: "Lower",
    pearl: "Designed for stability. Often compensates for poor hip or thoracic mobility.",
    actions: {
      Sagittal: [
        { label: "Flexion", howTo: "Bend forward at the waist, reaching for the toes." },
        { label: "Extension", howTo: "Lean the lower back backward." }
      ],
      Frontal: [
        { label: "Lateral Flexion", howTo: "Slide the hand down the side of the leg." }
      ],
      Transverse: [
        { label: "Rotation", howTo: "Minimal rotation occurs here; focus on the Thoracic spine for twist." }
      ]
    }
  },
  { 
    name: "Pelvis", 
    type: "Axial", 
    region: "Lower",
    pearl: "The 'Engine Room' of gait. Connects the upper and lower kinetic chains.",
    actions: {
      Sagittal: [
        { label: "Anterior Tilt", howTo: "Tip the pelvis forward, arching the low back (butt out)." },
        { label: "Posterior Tilt", howTo: "Tuck the tailbone under, flattening the low back." }
      ],
      Frontal: [
        { label: "Hip Hike", howTo: "Lift one side of the pelvis up towards the ribs." },
        { label: "Pelvic Drop", howTo: "Allow one side of the pelvis to sink lower than the other." }
      ],
      Transverse: [
        { label: "Rotation", howTo: "Rotate the pelvis left or right while keeping the feet planted." }
      ]
    }
  },
  { 
    name: "Sacrum", 
    type: "Axial", 
    region: "Lower",
    pearl: "The keystone of the pelvis. Movement is subtle but neurologically vital.",
    actions: {
      Sagittal: [
        { label: "Nutation", howTo: "The top of the sacrum tips forward/down." },
        { label: "Counter-Nutation", howTo: "The top of the sacrum tips backward/up." }
      ],
      Frontal: [{ label: "-", howTo: "No primary frontal action." }],
      Transverse: [{ label: "-", howTo: "No primary transverse action." }]
    }
  },
  { 
    name: "Shoulder (GH Joint)", 
    type: "Appendicular", 
    region: "Upper",
    pearl: "Most mobile joint. Slaved to the Scapula and Thoracic spine.",
    actions: {
      Sagittal: [
        { label: "Flexion", howTo: "Raise the arm forward and up overhead." },
        { label: "Extension", howTo: "Move the arm straight back behind the body." }
      ],
      Frontal: [
        { label: "Abduction", howTo: "Raise the arm out to the side and up." },
        { label: "Adduction", howTo: "Bring the arm across the front of the body." }
      ],
      Transverse: [
        { label: "Internal Rotation", howTo: "With elbow bent at 90°, rotate the forearm towards the belly." },
        { label: "External Rotation", howTo: "With elbow bent at 90°, rotate the forearm away from the belly." }
      ]
    }
  },
  { 
    name: "Scapula", 
    type: "Appendicular", 
    region: "Upper",
    pearl: "The foundation of shoulder function. Must glide freely over the ribs.",
    actions: {
      Sagittal: [
        { label: "Elevation", howTo: "Shrug the shoulders up towards the ears." },
        { label: "Depression", howTo: "Pull the shoulder blades down towards the back pockets." }
      ],
      Frontal: [
        { label: "Upward Rotation", howTo: "The bottom tip of the blade moves out and up (as in arm overhead)." },
        { label: "Downward Rotation", howTo: "The bottom tip of the blade moves in and down." }
      ],
      Transverse: [
        { label: "Protraction", howTo: "Reach forward, rounding the shoulders (blades move apart)." },
        { label: "Retraction", howTo: "Squeeze the shoulder blades together towards the spine." }
      ]
    }
  },
  { 
    name: "Elbow", 
    type: "Appendicular", 
    region: "Upper",
    pearl: "A hinge joint that allows for complex hand orientation.",
    actions: {
      Sagittal: [
        { label: "Flexion", howTo: "Bend the elbow, bringing the hand towards the shoulder." },
        { label: "Extension", howTo: "Straighten the arm completely." }
      ],
      Frontal: [{ label: "-", howTo: "No primary frontal action." }],
      Transverse: [
        { label: "Pronation", howTo: "Rotate the forearm so the palm faces down." },
        { label: "Supination", howTo: "Rotate the forearm so the palm faces up." }
      ]
    }
  },
  { 
    name: "Wrist", 
    type: "Appendicular", 
    region: "Upper",
    pearl: "Essential for fine motor control and upper limb integration.",
    actions: {
      Sagittal: [
        { label: "Flexion", howTo: "Bend the wrist so the palm moves towards the forearm." },
        { label: "Extension", howTo: "Bend the wrist so the back of the hand moves towards the forearm." }
      ],
      Frontal: [
        { label: "Radial Deviation", howTo: "Tilt the wrist towards the thumb side." },
        { label: "Ulnar Deviation", howTo: "Tilt the wrist towards the pinky side." }
      ],
      Transverse: [{ label: "-", howTo: "No primary transverse action." }]
    }
  },
  { 
    name: "Hand/Fingers", 
    type: "Appendicular", 
    region: "Upper",
    pearl: "High density of mechanoreceptors. Direct link to the motor cortex.",
    actions: {
      Sagittal: [
        { label: "Flexion", howTo: "Make a tight fist." },
        { label: "Extension", howTo: "Open the hand and stretch the fingers wide." }
      ],
      Frontal: [
        { label: "Abduction", howTo: "Spread the fingers apart from each other." },
        { label: "Adduction", howTo: "Bring the fingers together tightly." }
      ],
      Transverse: [{ label: "-", howTo: "No primary transverse action." }]
    }
  },
  { 
    name: "Hip", 
    type: "Appendicular", 
    region: "Lower",
    pearl: "Deep ball-and-socket joint. Essential for power and locomotion.",
    actions: {
      Sagittal: [
        { label: "Flexion", howTo: "Bring the knee up towards the chest." },
        { label: "Extension", howTo: "Move the leg straight back behind the body." }
      ],
      Frontal: [
        { label: "Abduction", howTo: "Move the leg out to the side away from the midline." },
        { label: "Adduction", howTo: "Bring the leg across the midline of the body." }
      ],
      Transverse: [
        { label: "Internal Rotation", howTo: "Rotate the thigh bone inwards (toes point in)." },
        { label: "External Rotation", howTo: "Rotate the thigh bone outwards (toes point out)." }
      ]
    }
  },
  { 
    name: "Knee", 
    type: "Appendicular", 
    region: "Lower",
    pearl: "Stability is key. Often compensates for hip or ankle dysfunction.",
    actions: {
      Sagittal: [
        { label: "Flexion", howTo: "Bend the knee, bringing the heel towards the buttock." },
        { label: "Extension", howTo: "Straighten the leg completely." }
      ],
      Frontal: [{ label: "-", howTo: "No primary frontal action." }],
      Transverse: [
        { label: "Tibial Internal Rotation", howTo: "With knee slightly bent, rotate the lower leg inwards." },
        { label: "Tibial External Rotation", howTo: "With knee slightly bent, rotate the lower leg outwards." }
      ]
    }
  },
  { 
    name: "Foot/Ankle", 
    type: "Appendicular", 
    region: "Lower",
    pearl: "Primary source of proprioceptive input for the cerebellum.",
    actions: {
      Sagittal: [
        { label: "Dorsiflexion", howTo: "Pull the toes and foot up towards the shin." },
        { label: "Plantar Flexion", howTo: "Point the toes and foot down away from the shin." }
      ],
      Frontal: [
        { label: "Inversion", howTo: "Tilt the foot so the sole faces inwards." },
        { label: "Eversion", howTo: "Tilt the foot so the sole faces outwards." }
      ],
      Transverse: [
        { label: "Internal Rotation", howTo: "Rotate the foot inwards at the ankle." },
        { label: "External Rotation", howTo: "Rotate the foot outwards at the ankle." }
      ]
    }
  }
];