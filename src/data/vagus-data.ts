export interface VagusAssociation {
  spinalSegment: string;
  muscle: string;
  organ: string;
  reciprocatingSegment: string;
}

export const VAGUS_ASSOCIATIONS: VagusAssociation[] = [
  { spinalSegment: "C1", muscle: "Buccinator", organ: "Glucagon/Pancreas", reciprocatingSegment: "L5" },
  { spinalSegment: "C2", muscle: "Masseter", organ: "Thymus", reciprocatingSegment: "L4" },
  { spinalSegment: "C3", muscle: "Diaphragm", organ: "Stomach", reciprocatingSegment: "L3" },
  { spinalSegment: "C4", muscle: "Subscapularis", organ: "Hypothalamus", reciprocatingSegment: "L2" },
  { spinalSegment: "C5", muscle: "External Pterygoid", organ: "Post Pituitary", reciprocatingSegment: "L1" },
  { spinalSegment: "C6", muscle: "Dorsal Interossei", organ: "Thymus", reciprocatingSegment: "T12" },
  { spinalSegment: "C7", muscle: "Supraspinatus", organ: "Thyroid", reciprocatingSegment: "T11" },
  { spinalSegment: "T1", muscle: "Occipitalis", organ: "Thalamus", reciprocatingSegment: "T10" },
  { spinalSegment: "T2", muscle: "Vastus Lateralis", organ: "Heart", reciprocatingSegment: "T9" },
  { spinalSegment: "T3", muscle: "Deltoids (Posterior)", organ: "Lung", reciprocatingSegment: "T8" },
  { spinalSegment: "T4", muscle: "Deltoids (Anterior)", organ: "Gall Bladder", reciprocatingSegment: "T7" },
  { spinalSegment: "T5", muscle: "Triceps", organ: "Spleen", reciprocatingSegment: "T6" },
  { spinalSegment: "T6", muscle: "Pectoralis Major (Clavicular)", organ: "Stomach", reciprocatingSegment: "T5" },
  { spinalSegment: "T7", muscle: "Orbicularis Oris", organ: "Exocrine Pancreas", reciprocatingSegment: "T4" },
  { spinalSegment: "T8", muscle: "Pectoralis Major (Sternal)", organ: "Liver", reciprocatingSegment: "T3" },
  { spinalSegment: "T9", muscle: "Piriformis", organ: "Adrenal Medulla", reciprocatingSegment: "T2" },
  { spinalSegment: "T10", muscle: "Psoas", organ: "Kidney", reciprocatingSegment: "T1" },
  { spinalSegment: "T11", muscle: "Flexor Hallucis Longus", organ: "Adrenal Cortex", reciprocatingSegment: "C7" },
  { spinalSegment: "T12", muscle: "Quadratus Lumborum", organ: "Large Intestine", reciprocatingSegment: "C6" },
  { spinalSegment: "L1", muscle: "Erector Spinae", organ: "Bladder", reciprocatingSegment: "C5" },
  { spinalSegment: "L2", muscle: "Tensor Fasciae Latae (TFL)", organ: "Sigmoid Colon", reciprocatingSegment: "C4" },
  { spinalSegment: "L3", muscle: "Gluteus Maximus", organ: "Ascending Colon", reciprocatingSegment: "C3" },
  { spinalSegment: "L4", muscle: "Tibialis Anterior", organ: "Bladder", reciprocatingSegment: "C2" },
  { spinalSegment: "L5", muscle: "Hamstrings", organ: "Large Intestine", reciprocatingSegment: "C1" },
];

export const VAGAL_FUNCTIONS = [
  "Humming",
  "Swallowing",
  "Say AAh",
  "Clean Mouth with Tongue",
  "Smile with Teeth and Swallow"
];

export const VAGAL_GLANDS = [
  { name: "Hypothalamus", reflex: "Tongue to roof of mouth", icon: "Brain" },
  { name: "Thymus", reflex: "Masseter (Jaw)", icon: "Shield" },
  { name: "Thyroid", reflex: "Supraspinatus (Shoulder)", icon: "Zap" },
  { name: "Pineal", reflex: "Tongue to soft palate", icon: "Sparkles" },
];

export const HAND_REFLEXOLOGY = {
  Right: {
    Light: [
      { name: "Adrenals/Thyroid", element: "Fire", color: "bg-pink-400" },
      { name: "Stomach", element: "Earth", color: "bg-yellow-400" },
      { name: "Large Intestine", element: "Metal", color: "bg-slate-200" },
      { name: "GV / CV", element: "Central", color: "bg-purple-400" },
    ],
    Deep: [
      { name: "Sex Organs", element: "Fire", color: "bg-pink-400" },
      { name: "Spleen", element: "Earth", color: "bg-yellow-400" },
      { name: "Lung", element: "Metal", color: "bg-slate-200" },
    ]
  },
  Left: {
    Light: [
      { name: "Bladder", element: "Water", color: "bg-blue-400" },
      { name: "Gall Bladder", element: "Wood", color: "bg-emerald-400" },
      { name: "Small Intestine", element: "Fire", color: "bg-pink-400" },
    ],
    Deep: [
      { name: "Kidney", element: "Water", color: "bg-blue-400" },
      { name: "Liver", element: "Wood", color: "bg-emerald-400" },
      { name: "Heart", element: "Fire", color: "bg-pink-400" },
      { name: "GV / CV", element: "Central", color: "bg-purple-400" },
    ]
  }
};