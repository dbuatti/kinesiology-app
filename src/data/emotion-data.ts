"use client";

export interface PrimaryEmotion {
  id: string;
  label: string;
  element: string;
  organs: string[];
  color: string;
  textColor: string;
  insight: string;
}

export const PRIMARY_EMOTIONS: PrimaryEmotion[] = [
  { 
    id: 'hurt', 
    label: 'Hurt', 
    element: 'Fire',
    organs: ['Heart', 'Small Intestine'], 
    color: 'bg-rose-600', 
    textColor: 'text-rose-600',
    insight: "About being open-hearted and allowing yourself to receive love, not just give it."
  },
  { 
    id: 'worry', 
    label: 'Worry', 
    element: 'Earth',
    organs: ['Spleen', 'Stomach'], 
    color: 'bg-amber-500', 
    textColor: 'text-amber-600',
    insight: "Often involves overthinking about wanting to care for others or obligation."
  },
  { 
    id: 'sadness', 
    label: 'Sadness', 
    element: 'Metal',
    organs: ['Lung', 'Large Intestine'], 
    color: 'bg-slate-500', 
    textColor: 'text-slate-600',
    insight: "Related to loss of spirit, disconnection, or lacking connection to purpose."
  },
  { 
    id: 'fear', 
    label: 'Fear', 
    element: 'Water',
    organs: ['Kidney', 'Bladder'], 
    color: 'bg-blue-600', 
    textColor: 'text-blue-600',
    insight: "Relates to trusting your own instincts and feeling safe/connected."
  },
  { 
    id: 'anger', 
    label: 'Anger', 
    element: 'Wood',
    organs: ['Liver', 'Gallbladder'], 
    color: 'bg-emerald-600', 
    textColor: 'text-emerald-600',
    insight: "Often comes from confusion, lack of self-acceptance, or trying to be perfect."
  },
];

export const CHANNEL_EMOTIONS: Record<string, string[]> = {
  'Lung': ['Grief', 'Sadness', 'Guilt', 'Regret', 'Value', 'Worthless', 'Loss Of Spirit', 'Disconnection From Spirit', 'Separation (Wears Mask)'],
  'Large Intestine': ['Attachment', 'Letting Go', 'Holding On', 'Loss Of Others Or Things', 'Alienation', 'Longing For What Is Lost', 'Acknowledgment', 'Value', 'Respected'],
  'Stomach': ['External Needs', 'Sympathy', 'Worry About Others', 'Blame', 'Worry About Relationships', 'Protect', 'Obligation', 'Positivity', 'Ingratiating'],
  'Spleen': ['Self Analysis', 'Self Nourishment', 'Truth', 'Integrity', 'Care For Self', 'Self Is Lowest Priority', 'Needy', 'Contentment', 'Purpose', 'Fulfilled'],
  'Heart': ['Self-Love', 'In-Tune', 'Balance', 'Open To My Heart', 'Closed', 'Joy', 'Hurt', 'Emotional', 'Passion', 'Propriety', 'Spontaneity', 'Inner Boundaries'],
  'Small Intestine': ['Domineering', 'Elation', 'Calm', 'Excited', 'Understood', 'Open To Others', 'Sex', 'Intimacy', 'Love/Hate (Others)', 'Expression', 'Defensive', 'Outer Boundaries'],
  'Bladder': ['Control', 'Drive', 'Invisible', 'Withdrawn', 'Unsafe', 'Knowledge', 'Cleverness', 'Will', 'Safety', 'Security', 'Impatient', 'Can’t Rest', 'Disconnected From Others'],
  'Kidney': ['Fear', 'Anxiety', 'Trust', 'Faith', 'Stillness', 'Destiny', 'Alone', 'Numb To Self', 'Disconnected From Self', 'Essence', 'Instincts', 'Unrelenting', 'Core', 'Potential', 'Wisdom'],
  'Pericardium': ['Self-Love', 'In-Tune', 'Balance', 'Joy', 'Hurt', 'Passion', 'Inner Boundaries'],
  'San Jiao': ['Domineering', 'Elation', 'Calm', 'Excited', 'Outer Boundaries'],
  'Gall Bladder': ['Passive/Aggressive', 'Resentment', 'Stuck', 'Indecisive', 'Judgemental', 'Rejection', 'High Expectations', 'Doing', 'Moving Forward', 'Choice', 'Perfect', 'Right/Wrong', 'Courage'],
  'Liver': ['Anger', 'Rage', 'Frustration', 'Flow', 'Inflexibility', 'Stagnation', 'Acceptance Of Self', 'Hopeless', 'Expectations Of Self', 'Stuck', 'Self Esteem', 'Planning']
};

export const ELEMENT_EMOTIONS: Record<string, string[]> = {
  'FIRE': [...CHANNEL_EMOTIONS['Heart'], ...CHANNEL_EMOTIONS['Small Intestine'], ...CHANNEL_EMOTIONS['Pericardium'], ...CHANNEL_EMOTIONS['San Jiao']],
  'EARTH': [...CHANNEL_EMOTIONS['Spleen'], ...CHANNEL_EMOTIONS['Stomach']],
  'METAL': [...CHANNEL_EMOTIONS['Lung'], ...CHANNEL_EMOTIONS['Large Intestine']],
  'WATER': [...CHANNEL_EMOTIONS['Kidney'], ...CHANNEL_EMOTIONS['Bladder']],
  'WOOD': [...CHANNEL_EMOTIONS['Liver'], ...CHANNEL_EMOTIONS['Gall Bladder']]
};

export const EYE_POSITIONS = [
  { 
    id: 'v_mem', 
    label: 'Visual Memory', 
    sub: 'Seeing a scene from the past.', 
    pos: 'Up & Left',
    prompt: 'See that scene or memory play out on your mental screen.'
  },
  { 
    id: 'a_mem', 
    label: 'Auditory Memory', 
    sub: 'Hearing sounds or words from the past.', 
    pos: 'Horizontal Left',
    prompt: 'Hear those words or sounds exactly as they happened.'
  },
  { 
    id: 'i_mon', 
    label: 'Internal Monologue', 
    sub: 'What you say to yourself (e.g. "I am not lovable").', 
    pos: 'Down & Left',
    prompt: 'Repeat those specific words to yourself over and over.'
  },
  { 
    id: 'kin', 
    label: 'Kinesthetic / Felt Sense', 
    sub: 'Physical sensation or body association.', 
    pos: 'Down & Right',
    prompt: 'Focus entirely on where you feel that sensation in your body.'
  },
  { 
    id: 'a_con', 
    label: 'Auditory Constructed', 
    sub: 'Predicting what you think you will hear.', 
    pos: 'Horizontal Right',
    prompt: 'Focus on the sound or words you are projecting into the future.'
  },
  { 
    id: 'v_con', 
    label: 'Visual Constructed', 
    sub: 'Predicting what you think you will see.', 
    pos: 'Up & Right',
    prompt: 'Visualize the scenario you are imagining or projecting.'
  },
];