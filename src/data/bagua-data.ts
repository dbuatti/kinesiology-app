
export interface BaGuaProfile {
  number: number;
  name: string;
  element: string;
  meridians: string[];
  themes: string[];
  description: string;
  color: string;
  bgColor: string;
}

export const BAGUA_PROFILES: BaGuaProfile[] = [
  {
    number: 1,
    name: "Water",
    element: "Water",
    meridians: ["Bladder (BL)", "Yin Qiao Mai"],
    themes: ["Fear", "Loneliness", "Impotence", "Control", "Safety", "Connection", "Trust/Distrust", "Security"],
    description: "Focuses on the fundamental need for safety and the existential fear of being alone or powerless.",
    color: "text-primary",
    bgColor: "bg-primary/5"
  },
  {
    number: 2,
    name: "Earth",
    element: "Earth",
    meridians: ["Stomach (ST)", "Spleen (SP)", "Chong Mai"],
    themes: ["Care", "Nurture", "Satisfaction", "Neediness", "Truth", "Purpose", "Selfishness", "Protection"],
    description: "Centered around the dynamics of nurturing, being cared for, and finding true satisfaction.",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50"
  },
  {
    number: 3,
    name: "Thunder",
    element: "Wood",
    meridians: ["Gall Bladder (GB)", "Yang Wei Mai"],
    themes: ["Acceptance", "Criticism", "Rejection", "Judgement", "Failure", "Performance", "Success", "Flow"],
    description: "Driven by the need for success and the fear of being judged as 'not good enough'.",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50"
  },
  {
    number: 4,
    name: "Wind",
    element: "Wood",
    meridians: ["Liver (LV)", "Dai Mai"],
    themes: ["Freedom", "Avoid Rejection", "Responsibility", "Judgement", "Stagnation", "Stuck", "Flow"],
    description: "Values freedom of movement and expression, often struggling with the weight of others' expectations.",
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    number: 5,
    name: "Central Palace",
    element: "Metal / Earth",
    meridians: ["General System"],
    themes: ["Balance", "Receptivity", "Fulfillment", "Yearning", "Support", "Spirit Connection", "Fullness"],
    description: "The pivot point of the system, dealing with the core sense of being supported by life itself.",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50"
  },
  {
    number: 6,
    name: "Heaven",
    element: "Metal",
    meridians: ["Large Intestine (LI)", "Du Mai (GV)"],
    themes: ["Belonging", "Respect", "Value", "Worth", "Abandonment", "Separation", "Loss", "Alienation"],
    description: "Relates to the higher sense of value, authority, and the deep pain of feeling alienated or unworthy.",
    color: "text-muted-foreground",
    bgColor: "bg-muted"
  },
  {
    number: 7,
    name: "Lake",
    element: "Metal",
    meridians: ["Lung (LU)", "Ren Mai (CV)"],
    themes: ["Valued", "Respected", "Innocence", "Joy", "Worth", "Emptiness", "Separation"],
    description: "Focuses on the joy of connection and the preservation of inner innocence and worth.",
    color: "text-indigo-400",
    bgColor: "bg-indigo-50"
  },
  {
    number: 8,
    name: "Mountain",
    element: "Water",
    meridians: ["Kidney (KI)", "Yin Wei Mai"],
    themes: ["Stillness", "Peace", "Withdrawal", "Closeness", "Connected", "Loneliness", "Safety"],
    description: "Seeks the deep peace of stillness, often oscillating between the need for withdrawal and the desire for closeness.",
    color: "text-blue-800",
    bgColor: "bg-primary/10"
  },
  {
    number: 9,
    name: "Fire",
    element: "Fire",
    meridians: ["Heart (HT)", "Small Intestine (SI)", "Yang Qiao Mai"],
    themes: ["Love", "Joy", "Hurt", "Shame", "Embarrassment", "Bonding", "Openness", "Vulnerability"],
    description: "The most expressive constitution, dealing with the vulnerability of sharing one's heart and the fear of being hurt.",
    color: "text-rose-600",
    bgColor: "bg-rose-50"
  }
];