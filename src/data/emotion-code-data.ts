"use client";

export interface EmotionCell {
  columnA: string[];
  columnB: string[];
}

export const EMOTION_CODE_CHART: Record<number, EmotionCell> = {
  1: {
    columnA: ["Abandonment", "Betrayal", "Forlorn", "Lost", "Love Unreceived"],
    columnB: ["Effort Unreceived", "Heartache", "Insecurity", "Overjoyed", "Vulnerability"]
  },
  2: {
    columnA: ["Anxiety", "Despair", "Disgust", "Nervousness", "Worry"],
    columnB: ["Failure", "Helplessness", "Hopelessness", "Lack of Control", "Low Self-Esteem"]
  },
  3: {
    columnA: ["Crying", "Discouragement", "Rejection", "Sadness", "Sorrow"],
    columnB: ["Confusion", "Defensiveness", "Grief", "Self-Abuse", "Stubbornness"]
  },
  4: {
    columnA: ["Anger", "Bitterness", "Guilt", "Hatred", "Resentment"],
    columnB: ["Depression", "Frustration", "Indecisiveness", "Panic", "Taken for Granted"]
  },
  5: {
    columnA: ["Blame", "Dread", "Fear", "Horror", "Peeved"],
    columnB: ["Conflict", "Creative Insecurity", "Terror", "Unsupported", "Wishy Washy"]
  },
  6: {
    columnA: ["Humiliation", "Jealousy", "Longing", "Lust", "Overwhelm"],
    columnB: ["Pride", "Shame", "Shock", "Unworthy", "Worthless"]
  }
};

export const ROW_ASSOCIATIONS: Record<number, string> = {
  1: "Heart or Small Intestine",
  2: "Spleen or Stomach",
  3: "Lung or Large Intestine",
  4: "Liver or Gallbladder",
  5: "Kidneys or Bladder",
  6: "Glands or Sexual Organs"
};