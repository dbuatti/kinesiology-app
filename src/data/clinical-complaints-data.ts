"use client";

export interface ClinicalComplaint {
  complaint: string;
  category: 'Structural' | 'Emotional' | 'Physiological' | 'Neurological';
  priorityMuscles: string[];
  priorityMeridians: string[];
  reflexPoints: string[];
  insights: string;
}

export const CLINICAL_COMPLAINTS: ClinicalComplaint[] = [
  {
    complaint: "Lower Back Pain (Acute)",
    category: "Structural",
    priorityMuscles: ["Psoas", "Quadratus Lumborum", "Gluteus Medius", "Sacrospinalis"],
    priorityMeridians: ["Kidney", "Large Intestine", "Bladder"],
    reflexPoints: ["K27", "SIJ Ligaments", "L4/L5 Spinal Fixation"],
    insights: "Check for 'Hip Hike' gait. If Psoas is inhibited, the QL often becomes hypertonic to compensate. Address Kidney meridian for underlying fear/stress."
  },
  {
    complaint: "Brain Fog / Mental Fatigue",
    category: "Neurological",
    priorityMuscles: ["Supraspinatus", "SCM", "Upper Trapezius", "Diaphragm"],
    priorityMeridians: ["Central", "Lung", "Kidney"],
    reflexPoints: ["GV20", "Cervical Lymphatics", "Carotid Pulse"],
    insights: "Often a 'Drainage' issue. Check Cervical Lymphatics and Vagus Nerve tone. Ensure BOLT score is > 25s to rule out hypocapnia-induced vasoconstriction."
  },
  {
    complaint: "Anxiety / Panic",
    category: "Emotional",
    priorityMuscles: ["Diaphragm", "Subscapularis", "Pectoralis Major (Clavicular)"],
    priorityMeridians: ["Heart", "Stomach", "Pericardium"],
    reflexPoints: ["CV17", "ESR Points", "Adrenal Reflexes"],
    insights: "Priority is SNS Down-regulation. Use Harmonic Rocking and Diaphragm Reset. Check for 'Frozen' breathing patterns and Heart/Brain Coherence."
  },
  {
    complaint: "Digestive Bloating / Stasis",
    category: "Physiological",
    priorityMuscles: ["Pectoralis Major (Clavicular)", "Latissimus Dorsi", "Quadriceps Group"],
    priorityMeridians: ["Stomach", "Spleen", "Small Intestine"],
    reflexPoints: ["Cisterna Chyli", "T6 Spinal Fixation", "Ileocecal Valve"],
    insights: "Check for 'Switching' (K27). If Latissimus Dorsi is weak, consider blood sugar regulation and Spleen meridian integrity."
  },
  {
    complaint: "Shoulder Restriction (Frozen)",
    category: "Structural",
    priorityMuscles: ["Supraspinatus", "Subscapularis", "Teres Minor", "Serratus Anterior"],
    priorityMeridians: ["Central", "Heart", "San Jiao", "Lung"],
    reflexPoints: ["C5/C6 Myotomes", "Bregma NV", "Thoracic Lymphatics"],
    insights: "Often linked to 'Heart' or 'Lung' emotional protection. Check for ribcage mobility and Phrenic nerve (Diaphragm) involvement."
  },
  {
    complaint: "Chronic Fatigue / Burnout",
    category: "Physiological",
    priorityMuscles: ["Psoas", "Teres Minor", "Sartorius", "Piriformis"],
    priorityMeridians: ["Kidney", "San Jiao", "Pericardium"],
    reflexPoints: ["Adrenal NV", "Thymus", "K27"],
    insights: "Classic 'Triple Warmer' (San Jiao) dominance. The body is stuck in a survival loop. Prioritize Vagus Nerve stimulation and Kidney essence (Jing) support."
  },
  {
    complaint: "Cold Feet (Chronic/Systemic)",
    category: "Physiological",
    priorityMuscles: ["Psoas", "Popliteus", "Gastrocnemius"],
    priorityMeridians: ["Spleen", "Kidney", "Bladder"],
    reflexPoints: ["Hypothalamus", "Thyroid", "Adrenal Pulse"],
    insights: "Usually a systemic circulatory or metabolic issue. Check Hypothalamus (temperature regulation) against other brain areas. In TCM, often linked to Spleen deficiency."
  },
  {
    complaint: "Vertigo (Limbic/Anxiety-Driven)",
    category: "Neurological",
    priorityMuscles: ["SCM", "Upper Trapezius", "Deep Neck Flexors"],
    priorityMeridians: ["Central", "Governing", "Kidney"],
    reflexPoints: ["GV16 (Cerebellum)", "Limbic System", "CN VIII"],
    insights: "Shared pathways between the vestibular and limbic systems. If positional tests are clear but symptoms persist, prioritize emotional integration and SNS down-regulation. 'Letting Go' (David Hawkins) is a recommended resource."
  }
];