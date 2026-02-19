export type TcmElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water' | 'None';
export type YinYang = 'Yin' | 'Yang' | 'None';

export interface TcmChannel {
  id: string;
  name: string;
  code: string;
  element: TcmElement;
  yinYang: YinYang;
  peakTime: string;
  oppositeId: string; // Midday-Midnight Partner
  emotions: string[];
  muscles: string[];
  description: string;
  color: string;
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
    muscles: ['Serratus Anterior', 'Deltoids (Middle)', 'Coracobrachialis', 'Diaphragm'],
    description: "Governs respiration and the intake of Qi. Associated with the skin and immune system (Wei Qi).",
    color: "bg-slate-200 text-slate-800"
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
    muscles: ['Tensor Fasciae Latae (TFL)', 'Hamstrings', 'Quadratus Lumborum'],
    description: "Responsible for waste elimination and the 'letting go' of both physical and emotional baggage.",
    color: "bg-slate-400 text-white"
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
    muscles: ['Pectoralis Major (Clavicular)', 'Biceps', 'Brachioradialis', 'Sternocleidomastoid (SCM)', 'Levator Scapula'],
    description: "The 'Sea of Food and Drink'. Responsible for receiving and ripening food/information.",
    color: "bg-yellow-400 text-yellow-900"
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
    muscles: ['Latissimus Dorsi', 'Middle Trapezius', 'Lower Trapezius', 'Triceps', 'Opponens Pollicis'],
    description: "Governs transformation and transportation of nutrients. Controls the muscles and limbs.",
    color: "bg-yellow-600 text-white"
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
    muscles: ['Subscapularis'],
    description: "The 'Monarch' of the organs. Houses the Shen (Spirit) and governs blood circulation.",
    color: "bg-red-500 text-white"
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
    muscles: ['Quadriceps Group', 'Abdominals'],
    description: "Separates the 'pure' from the 'impure' on both physical and mental levels.",
    color: "bg-red-700 text-white"
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
    muscles: ['Peroneus', 'Sacrospinalis', 'Tibialis Anterior', 'Extensor Hallucis Longus'],
    description: "Governs the storage and excretion of fluids. The longest meridian, running down the entire back.",
    color: "bg-blue-700 text-white"
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
    muscles: ['Psoas', 'Iliacus', 'Upper Trapezius'],
    description: "The root of life. Stores Jing (Essence) and governs growth, reproduction, and bone health.",
    color: "bg-blue-500 text-white"
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
    muscles: ['Gluteus Medius', 'Gluteus Maximus', 'Adductors', 'Piriformis'],
    description: "The 'Heart Protector'. Governs circulation and protects the heart from emotional shock.",
    color: "bg-pink-500 text-white"
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
    muscles: ['Teres Minor', 'Sartorius', 'Gracilis', 'Soleus', 'Gastrocnemius'],
    description: "The 'Triple Warmer'. Coordinates the three burning spaces (Upper, Middle, Lower) and fluid metabolism.",
    color: "bg-orange-500 text-white"
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
    muscles: ['Anterior Deltoid', 'Popliteus'],
    description: "Governs decision making and the courage to act. Controls the tendons.",
    color: "bg-emerald-700 text-white"
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
    muscles: ['Pectoralis Major (Sternal)', 'Rhomboids'],
    description: "The 'General'. Ensures the smooth flow of Qi throughout the body. Stores blood and opens to the eyes.",
    color: "bg-emerald-500 text-white"
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
    color: "bg-indigo-500 text-white"
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
    color: "bg-purple-500 text-white"
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