export interface Acupoint {
  code: string;
  name: string;
  location: string;
  function: string;
  category: 'Governing' | 'Conception' | 'Kidney' | 'Liver' | 'Heart' | 'Lung' | 'Stomach' | 'Spleen' | 'Bladder' | 'Gallbladder' | 'Large Intestine' | 'Small Intestine' | 'Pericardium' | 'Triple Warmer';
}

export const ACUPOINTS: Acupoint[] = [
  {
    code: "GV20",
    name: "Hundred Meetings",
    location: "Top of the head, on the midline.",
    function: "Clears the mind, lifts spirit, grounding, relieves headaches and dizziness.",
    category: "Governing"
  },
  {
    code: "KI27",
    name: "Shu Mansion",
    location: "In the depression below the clavicle, 2 cun lateral to the midline.",
    function: "Primary point for neurological switching, grounding, and respiratory issues.",
    category: "Kidney"
  },
  {
    code: "CV17",
    name: "Chest Center",
    location: "On the midline of the sternum, level with the 4th intercostal space.",
    function: "Emotional release, anxiety, chest tension, tonifies Qi.",
    category: "Conception"
  },
  {
    code: "LI4",
    name: "Union Valley",
    location: "On the back of the hand, between the 1st and 2nd metacarpal bones.",
    function: "Pain relief, clears heat, releases the exterior, moves Qi.",
    category: "Large Intestine"
  },
  {
    code: "PC6",
    name: "Inner Pass",
    location: "2 cun above the wrist crease, between the tendons.",
    function: "Calms the heart, relieves nausea, opens the chest, emotional balance.",
    category: "Pericardium"
  },
  {
    code: "ST36",
    name: "Leg Three Miles",
    location: "3 cun below the knee cap, 1 cun lateral to the tibial crest.",
    function: "Major tonification point, boosts energy, aids digestion, strengthens immunity.",
    category: "Stomach"
  },
  {
    code: "LV3",
    name: "Great Surge",
    location: "On the top of the foot, in the hollow between the 1st and 2nd metatarsals.",
    function: "Spreads Liver Qi, relieves stress, anger, and frustration, clears the eyes.",
    category: "Liver"
  },
  {
    code: "SP6",
    name: "Three Yin Intersection",
    location: "3 cun above the inner ankle bone, behind the tibia.",
    function: "Nourishes blood and Yin, calms the mind, regulates hormones.",
    category: "Spleen"
  },
  {
    code: "HT7",
    name: "Spirit Gate",
    location: "At the wrist crease, on the radial side of the flexor carpi ulnaris tendon.",
    function: "Primary point for insomnia, anxiety, and calming the Shen (Spirit).",
    category: "Heart"
  },
  {
    code: "LU1",
    name: "Middle Palace",
    location: "On the lateral chest, 6 cun from the midline, in the 1st intercostal space.",
    function: "Opens the lungs, relieves cough/asthma, addresses grief.",
    category: "Lung"
  }
];