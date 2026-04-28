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
    organ: "Heart / Small Intestine", 
    muscles: "Vastus Lateralis, Subscapularis, Quads, Abdominals" 
  },
  2: { 
    organ: "Spleen / Stomach", 
    muscles: "Triceps, Traps, PMC, Diaphragm, Neck Flexors" 
  },
  3: { 
    organ: "Lung / Colon", 
    muscles: "Posterior Deltoid, TFL, Glute Max, QL" 
  },
  4: { 
    organ: "Liver / Gallbladder", 
    muscles: "PMS, Rhomboids, Anterior Deltoid, Popliteus" 
  },
  5: { 
    organ: "Kidneys / Bladder", 
    muscles: "Psoas, Upper Traps, Erector Spinae" 
  },
  6: { 
    organ: "Glands / Sexual Organs", 
    muscles: "Piriformis, Flexor Hallucis, Supraspinatus, Glute Medius" 
  }
};