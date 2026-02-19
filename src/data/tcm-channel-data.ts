export type TcmElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water' | 'None';
export type YinYang = 'Yin' | 'Yang' | 'None';

export interface TcmChannel {
  id: string;
  name: string;
  code: string;
  element: TcmElement;
  yinYang: YinYang;
  peakTime: string;
  oppositeId: string;
  emotions: string[];
  muscles: string[];
  description: string;
  color: string;
  hexColor: string; // For visualizations
  balancingTips: string[];
}

export const TCM_CHANNELS: TcmChannel[] = [
  {
    id: "LU",
    name: "Lung",
    code: "LU",
    element: "Metal",
    yinYang: "Yin",
    peakTime: "3am - 5am",
    oppositeId: "BL",
    emotions: ['Grief', 'Sadness', 'Guilt', 'Regret', 'Value', 'Worthless', 'Loss Of Spirit', 'Disconnection From Spirit', 'Separation (Wears Mask)'],
    muscles: ['Upper Trapezius', 'Anterior Deltoid', 'Pectoralis Major (Clavicular)', 'Pec Minor'],
    description: "Governs respiration and the intake of Qi. Associated with the skin and immune system (Wei Qi).",
    color: "bg-slate-200 text-slate-800",
    hexColor: "#e2e8f0",
    balancingTips: ["Deep breathing exercises", "Acknowledge grief", "Check skin health"]
  },
  {
    id: "LI",
    name: "Large Intestine",
    code: "LI",
    element: "Metal",
    yinYang: "Yang",
    peakTime: "5am - 7am",
    oppositeId: "KI",
    emotions: ['Attachment', 'Letting Go', 'Holding On', 'Loss Of Others Or Things', 'Alienation', 'Longing For What Is Lost', 'Acknowledgment', 'Value', 'Respected'],
    muscles: ['Middle Deltoid'],
    description: "Responsible for waste elimination and the 'letting go' of both physical and emotional baggage.",
    color: "bg-slate-400 text-white",
    hexColor: "#94a3b8",
    balancingTips: ["Hydration", "Abdominal massage", "Practice 'letting go'"]
  },
  {
    id: "ST",
    name: "Stomach",
    code: "ST",
    element: "Earth",
    yinYang: "Yang",
    peakTime: "7am - 9am",
    oppositeId: "PC",
    emotions: ['External Needs', 'Sympathy', 'Worry About Others', 'Blame', 'Worry About Relationships', 'Protect', 'Obligation', 'Positivity', 'Ingratiating'],
    muscles: ['Sternocleidomastoid (SCM)', 'Scalenes', 'Neck Extensors', 'Transverse Abdominals', 'External Obs', 'Internal Obs', 'Rectus Abdominals', 'Quadriceps Group', 'Tibialis Anterior', 'VMO', 'Rec Fem', 'Biceps', 'Deep Neck Flexors'],
    description: "The 'Sea of Food and Drink'. Responsible for receiving and ripening food/information.",
    color: "bg-yellow-400 text-yellow-900",
    hexColor: "#facc15",
    balancingTips: ["Mindful eating", "Grounding exercises", "Check HCL levels"]
  },
  {
    id: "SP",
    name: "Spleen",
    code: "SP",
    element: "Earth",
    yinYang: "Yin",
    peakTime: "9am - 11am",
    oppositeId: "SJ",
    emotions: ['Self Analysis', 'Self Nourishment', 'Truth', 'Integrity', 'Care For Self', 'Self Is Lowest Priority', 'Needy', 'Contentment', 'Purpose', 'Fulfilled'],
    muscles: ['Latissimus Dorsi', 'Lower Trapezius', 'Sartorius'],
    description: "Governs transformation and transportation of nutrients. Controls the muscles and limbs.",
    color: "bg-yellow-600 text-white",
    hexColor: "#ca8a04",
    balancingTips: ["Warm foods", "Avoid over-thinking", "Gentle movement"]
  },
  {
    id: "HT",
    name: "Heart",
    code: "HT",
    element: "Fire",
    yinYang: "Yin",
    peakTime: "11am - 1pm",
    oppositeId: "GB",
    emotions: ['Self-Love', 'In-Tune', 'Balance', 'Open To My Heart', 'Closed', 'Joy', 'Hurt', 'Emotional', 'Passion', 'Propriety', 'Spontaneity', 'Inner Boundaries'],
    muscles: ['Vastus Lateralis'],
    description: "The 'Monarch' of the organs. Houses the Shen (Spirit) and governs blood circulation.",
    color: "bg-red-500 text-white",
    hexColor: "#ef4444",
    balancingTips: ["Laughter", "Connection with others", "Rest during midday"]
  },
  {
    id: "SI",
    name: "Small Intestine",
    code: "SI",
    element: "Fire",
    yinYang: "Yang",
    peakTime: "1pm - 3pm",
    oppositeId: "LV",
    emotions: ['Domineering', 'Elation', 'Calm', 'Excited', 'Understood', 'Open To Others', 'Sex', 'Intimacy', 'Love/Hate (Others)', 'Expression', 'Defensive', 'Outer Boundaries'],
    muscles: ['Triceps', 'Infraspinatus', 'Levator Scapula'],
    description: "Separates the 'pure' from the 'impure' on both physical and mental levels.",
    color: "bg-red-700 text-white",
    hexColor: "#b91c1c",
    balancingTips: ["Discernment practice", "Check digestion", "Set clear boundaries"]
  },
  {
    id: "BL",
    name: "Bladder",
    code: "BL",
    element: "Water",
    yinYang: "Yang",
    peakTime: "3pm - 5pm",
    oppositeId: "LU",
    emotions: ['Control', 'Drive', 'Invisible', 'Withdrawn', 'Unsafe', 'Knowledge', 'Cleverness', 'Will', 'Safety', 'Security', 'Impatient', 'Can’t Rest', 'Disconnected From Others'],
    muscles: ['Sacrospinalis', 'Multifidi', 'Pelvic Floor (Anterior)', 'Pelvic Floor (Posterior)', 'Erector Spinae', 'Hamstrings', 'Soleus', 'Gastrocnemius', 'Popliteus', 'Gluteus Maximus', 'Tibialis Anterior', 'Fibularis Longus'],
    description: "Governs the storage and excretion of fluids. The longest meridian, running down the entire back.",
    color: "bg-blue-700 text-white",
    hexColor: "#1d4ed8",
    balancingTips: ["Salt intake check", "Spinal stretches", "Address deep fears"]
  },
  {
    id: "KI",
    name: "Kidney",
    code: "KI",
    element: "Water",
    yinYang: "Yin",
    peakTime: "5pm - 7pm",
    oppositeId: "LI",
    emotions: ['Fear', 'Anxiety', 'Trust', 'Faith', 'Stillness', 'Destiny', 'Alone', 'Numb To Self', 'Disconnected From Self', 'Essence', 'Instincts', 'Unrelenting', 'Core', 'Potential', 'Wisdom'],
    muscles: ['Psoas', 'Rectus Abdominals', 'Adductors', 'Quadratus Lumborum'],
    description: "The root of life. Stores Jing (Essence) and governs growth, reproduction, and bone health.",
    color: "bg-blue-500 text-white",
    hexColor: "#3b82f6",
    balancingTips: ["Rest and quiet", "Warm the lower back", "Trust the process"]
  },
  {
    id: "PC",
    name: "Pericardium",
    code: "PC",
    element: "Fire",
    yinYang: "Yin",
    peakTime: "7pm - 9pm",
    oppositeId: "ST",
    emotions: ['Self-Love', 'In-Tune', 'Balance', 'Joy', 'Hurt', 'Passion', 'Inner Boundaries'],
    muscles: ['Biceps', 'Pectoralis Major (Sternal)', 'Serratus Anterior', 'Diaphragm', 'Gluteus Medius', 'Piriformis', 'Gluteus Minimus', 'Adductors', 'Coracobrachialis'],
    description: "The 'Heart Protector'. Governs circulation and protects the heart from emotional shock.",
    color: "bg-pink-500 text-white",
    hexColor: "#ec4899",
    balancingTips: ["Gentle social time", "Protect the heart", "Emotional expression"]
  },
  {
    id: "SJ",
    name: "San Jiao",
    code: "SJ",
    element: "Fire",
    yinYang: "Yang",
    peakTime: "9pm - 11pm",
    oppositeId: "SP",
    emotions: ['Domineering', 'Elation', 'Calm', 'Excited', 'Outer Boundaries'],
    muscles: ['Teres Minor', 'Infraspinatus', 'Posterior Deltoid', 'Flexor Hallucis Longus', 'Sartorius', 'Soleus', 'Gastrocnemius', 'Tibialis Posterior'],
    description: "The 'Triple Warmer'. Coordinates the three burning spaces (Upper, Middle, Lower) and fluid metabolism.",
    color: "bg-orange-500 text-white",
    hexColor: "#f97316",
    balancingTips: ["Wind down for sleep", "Regulate body temp", "Calm the SNS"]
  },
  {
    id: "GB",
    name: "Gall Bladder",
    code: "GB",
    element: "Wood",
    yinYang: "Yang",
    peakTime: "11pm - 1am",
    oppositeId: "HT",
    emotions: ['Passive/Aggressive', 'Resentment', 'Stuck', 'Indecisive', 'Judgemental', 'Rejection', 'High Expectations', 'Doing', 'Moving Forward', 'Choice', 'Perfect', 'Right/Wrong', 'Courage'],
    muscles: ['Tensor Fasciae Latae (TFL)', 'Piriformis', 'Tibialis Posterior', 'Peroneus Longus'],
    description: "Governs decision making and the courage to act. Controls the tendons.",
    color: "bg-emerald-700 text-white",
    hexColor: "#047857",
    balancingTips: ["Sleep before midnight", "Make a decision", "Release resentment"]
  },
  {
    id: "LV",
    name: "Liver",
    code: "LV",
    element: "Wood",
    yinYang: "Yin",
    peakTime: "1am - 3am",
    oppositeId: "SI",
    emotions: ['Anger', 'Rage', 'Frustration', 'Flow', 'Inflexibility', 'Stagnation', 'Acceptance Of Self', 'Hopeless', 'Expectations Of Self', 'Stuck', 'Self Esteem', 'Planning'],
    muscles: ['Rhomboids', 'Gracilis', 'Psoas'],
    description: "The 'General'. Ensures the smooth flow of Qi throughout the body. Stores blood and opens to the eyes.",
    color: "bg-emerald-500 text-white",
    hexColor: "#10b981",
    balancingTips: ["Deep sleep", "Detoxification", "Practice flexibility"]
  },
  {
    id: "CV",
    name: "Central",
    code: "CV",
    element: "None",
    yinYang: "Yin",
    peakTime: "None",
    oppositeId: "GV",
    emotions: ['Self-Worth', 'Confidence', 'Shame', 'Vulnerability'],
    muscles: ['Supraspinatus'],
    description: "The Conception Vessel. The 'Sea of Yin'. Runs up the front midline of the body.",
    color: "bg-indigo-500 text-white",
    hexColor: "#6366f1",
    balancingTips: ["Zip up the midline", "Affirm self-worth", "Protect vulnerability"]
  },
  {
    id: "GV",
    name: "Governing",
    code: "GV",
    element: "None",
    yinYang: "Yang",
    peakTime: "None",
    oppositeId: "CV",
    emotions: ['Authority', 'Support', 'Burden', 'Responsibility'],
    muscles: ['Teres Major'],
    description: "The Governing Vessel. The 'Sea of Yang'. Runs up the back midline of the body.",
    color: "bg-purple-500 text-white",
    hexColor: "#a855f7",
    balancingTips: ["Stand tall", "Accept support", "Balance responsibility"]
  }
];

export const getChannelByMuscle = (muscleName: string): TcmChannel | undefined => {
  return TCM_CHANNELS.find(c => c.muscles.includes(muscleName));
};

export const getChannelByName = (name: string): TcmChannel | undefined => {
  const search = name.toLowerCase();
  return TCM_CHANNELS.find(c => 
    c.name.toLowerCase() === search || 
    c.code.toLowerCase() === search ||
    (search.includes(c.name.toLowerCase()) && c.name.length > 3)
  );
};