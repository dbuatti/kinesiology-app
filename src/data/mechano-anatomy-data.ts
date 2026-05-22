export interface AnatomyStructure {
  name: string;
  type: 'Ligament' | 'Tendon';
  desc: string;
  test: string;
  correction: string;
  defaultImageUrl: string;
}

export const anatomyStructures: Record<string, Record<string, AnatomyStructure>> = {
  knee: {
    mcl: {
      name: "Medial Collateral Ligament (MCL)",
      type: "Ligament",
      desc: "Located on the inside of the knee. Resists valgus (knock-knee) forces.",
      test: "Gently push the outside of the knee inwards while holding the ankle to stretch the MCL.",
      correction: "Hold GV16 (base of skull) while applying a light stretch to the MCL. Tap the cranium or apply a tuning fork for 3-5 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
    },
    lcl: {
      name: "Lateral Collateral Ligament (LCL)",
      type: "Ligament",
      desc: "Located on the outside of the knee. Resists varus (bow-leg) forces.",
      test: "Gently push the inside of the knee outwards while holding the ankle to stretch the LCL.",
      correction: "Hold GV16 (base of skull) while applying a light stretch to the LCL. Tap the cranium or apply a tuning fork for 3-5 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=800&q=80"
    },
    patellar: {
      name: "Patellar Tendon",
      type: "Tendon",
      desc: "Connects the kneecap (patella) to the shinbone (tibia). Transmits force from the quadriceps.",
      test: "Have the client perform a light knee extension (straightening the leg).",
      correction: "Hold contralateral S1 (opposite sensory cortex) while the client performs a 30% isometric knee extension for 60 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80"
    },
    quadriceps: {
      name: "Quadriceps Tendon",
      type: "Tendon",
      desc: "Connects the quadriceps muscle to the top of the kneecap.",
      test: "Have the client perform a light knee extension or resist knee flexion.",
      correction: "Hold contralateral S1 while the client performs a 30% isometric knee extension for 60 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80"
    }
  },
  ankle: {
    atfl: {
      name: "Anterior Talofibular Ligament (ATFL)",
      type: "Ligament",
      desc: "Located on the front-outside of the ankle. Most commonly injured ligament in ankle sprains.",
      test: "Gently pull the foot forward and turn it inwards (plantarflexion + inversion) to stretch the ATFL.",
      correction: "Hold GV16 while applying a light stretch to the ATFL. Tap the cranium or apply a tuning fork for 3-5 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=800&q=80"
    },
    cfl: {
      name: "Calcaneofibular Ligament (CFL)",
      type: "Ligament",
      desc: "Located on the outside of the ankle, connecting the fibula to the heel bone.",
      test: "Gently tilt the sole of the foot inwards (inversion) to stretch the CFL.",
      correction: "Hold GV16 while applying a light stretch to the CFL. Tap the cranium or apply a tuning fork for 3-5 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80"
    },
    achilles: {
      name: "Achilles Tendon",
      type: "Tendon",
      desc: "The thickest tendon in the body, connecting the calf muscles to the heel bone.",
      test: "Have the client perform a light calf raise or point the toes down against resistance.",
      correction: "Hold contralateral S1 while the client performs a 30% isometric plantarflexion (pointing toes down) for 60 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=800&q=80"
    }
  },
  shoulder: {
    supraspinatus: {
      name: "Supraspinatus Tendon",
      type: "Tendon",
      desc: "Part of the rotator cuff. Initiates abduction and stabilizes the humeral head.",
      test: "Have the client perform a light shoulder abduction (raising arm to the side) or 'empty can' test.",
      correction: "Hold contralateral S1 (opposite sensory cortex) while the client performs a 30% isometric shoulder abduction for 60 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80"
    },
    ghl: {
      name: "Glenohumeral Ligament (GHL)",
      type: "Ligament",
      desc: "Reinforces the joint capsule. Resists anterior translation and external rotation.",
      test: "Gently perform an anterior drawer test or passive external rotation of the shoulder.",
      correction: "Hold GV16 (base of skull) while applying a light passive external rotation stretch to the shoulder. Tap the cranium or apply a tuning fork for 3-5 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80"
    },
    biceps: {
      name: "Biceps Tendon (Long Head)",
      type: "Tendon",
      desc: "Runs through the bicipital groove. Stabilizes the shoulder and flexes the elbow.",
      test: "Have the client perform a light shoulder flexion or elbow flexion against resistance.",
      correction: "Hold contralateral S1 while the client performs a 30% isometric shoulder flexion for 60 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80"
    },
    ac: {
      name: "Acromioclavicular (AC) Ligament",
      type: "Ligament",
      desc: "Connects the acromion of the scapula to the clavicle.",
      test: "Gently press down on the distal clavicle or perform a horizontal adduction stretch.",
      correction: "Hold GV16 while applying a light downward pressure on the AC joint. Tap the cranium or apply a tuning fork for 3-5 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80"
    }
  },
  hip: {
    iliofemoral: {
      name: "Iliofemoral Ligament (Y-Ligament)",
      type: "Ligament",
      desc: "The strongest ligament in the body. Resists hyperextension of the hip.",
      test: "Gently extend the hip passively to stretch the iliofemoral ligament.",
      correction: "Hold GV16 while applying a light passive hip extension stretch. Tap the cranium or apply a tuning fork for 3-5 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80"
    },
    gluteus_med: {
      name: "Gluteus Medius Tendon",
      type: "Tendon",
      desc: "Inserts into the greater trochanter. Stabilizes the pelvis during single-leg stance.",
      test: "Have the client perform a light hip abduction (pushing leg out to the side).",
      correction: "Hold contralateral S1 while the client performs a 30% isometric hip abduction for 60 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80"
    },
    hamstring: {
      name: "Hamstring Tendon",
      type: "Tendon",
      desc: "Connects the hamstring muscles to the ischial tuberosity (sit bone).",
      test: "Have the client perform a light knee flexion or hip extension against resistance.",
      correction: "Hold contralateral S1 while the client performs a 30% isometric knee flexion for 60 seconds.",
      defaultImageUrl: "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=800&q=80"
    }
  }
};

export const sandboxActions = {
  Knee: {
    Sagittal: ["Flexion", "Extension"],
    Frontal: ["No primary action"],
    Transverse: ["Tibial Internal Rotation", "Tibial External Rotation"]
  },
  Ankle: {
    Sagittal: ["Dorsiflexion", "Plantar Flexion"],
    Frontal: ["Inversion", "Eversion"],
    Transverse: ["Internal Rotation", "External Rotation"]
  },
  Shoulder: {
    Sagittal: ["Flexion", "Extension"],
    Frontal: ["Abduction", "Adduction"],
    Transverse: ["Internal Rotation", "External Rotation"]
  },
  Hip: {
    Sagittal: ["Flexion", "Extension"],
    Frontal: ["Abduction", "Adduction"],
    Transverse: ["Internal Rotation", "External Rotation"]
  }
};