"use client";

export interface EmotionCell {
  columnA: string[];
  columnB: string[];
}

export interface RowData {
  organ: string;
  muscles: string;
}

export const EMOTION_CODE_CHART: Record<number, EmotionCell> = {
  1: {
    columnA: ["Abandonment", "Betrayal", "Defensiveness", "Forlorn", "Lost", "Love Unreceived"],
    columnB: ["Effort Unreceived", "Heartache", "Bitterness", "Insecurity", "Overjoy", "Vulnerability"]
  },
  2: {
    columnA: ["Anxiety", "Despair", "Disgust", "Nervousness", "Worry"],
    columnB: ["Failure", "Helplessness", "Hopelessness", "Lack of Control", "Low Self-Esteem"]
  },
  3: {
    columnA: ["Crying", "Discouragement", "Sadness", "Sorrow", "Confusion"],
    columnB: ["Grief", "Self-Abuse", "Shame", "Unworthy", "Worthless"]
  },
  4: {
    columnA: ["Anger", "Blaming", "Rejection", "Guilt", "Hatred", "Resentment"],
    columnB: ["Depression", "Frustration", "Indecisiveness", "Taken for Granted", "Stubbornness"]
  },
  5: {
    columnA: ["Dread", "Fear", "Horror", "Peeved", "Conflict"],
    columnB: ["Insecurity", "Terror", "Panic", "Unsupported", "Wishy Washy"]
  },
  6: {
    columnA: ["Humiliation", "Jealousy", "Longing", "Lust"],
    columnB: ["Overwhelm", "Pride", "Shock"]
  }
};

export const ROW_DATA: Record<number, RowData> = {
  1: { 
    organ: "HEART OR SMALL INTESTINE", 
    muscles: "Heart: Vastus Lateralis, Subscapularis; Small Intestine: Quads, Abdominals" 
  },
  2: { 
    organ: "SPLEEN OR STOMACH", 
    muscles: "Spleen: Triceps, Mid and Lower Traps; Stomach: PMC, Diaphragm, Neck Flexors" 
  },
  3: { 
    organ: "LUNG OR COLON", 
    muscles: "Lungs: Posterior Deltoid; Colon: TFL, Glute Max, QL" 
  },
  4: { 
    organ: "LIVER OR GALLBLADDER", 
    muscles: "Liver: PMS, Rhomboids; Gallbladder: Anterior Deltoid, Popliteus" 
  },
  5: { 
    organ: "KIDNEYS OR BLADDER", 
    muscles: "Kidney: Psoas, Upper Traps; Bladder: Erector Spinae" 
  },
  6: { 
    organ: "GLANDS OR SEXUAL ORGANS", 
    muscles: "Adrenals: Piriformis, Flexor Hallucis Longus; Thyroid: Supraspinatus; Reproductive: Glute Medius" 
  }
};

// Legacy export for backward compatibility if needed
export const ROW_ASSOCIATIONS: Record<number, string> = Object.keys(ROW_DATA).reduce((acc, key) => {
  acc[Number(key)] = ROW_DATA[Number(key)].organ;
  return acc;
}, {} as Record<number, string>);