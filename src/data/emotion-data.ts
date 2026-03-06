"use client";

import { TCM_CHANNELS } from "./tcm-channel-data";

// New Primary Emotion Mappings for the structured process
export const PRIMARY_EMOTIONS = [
  { id: 'hurt', label: 'Hurt', organs: ['Heart', 'Small Intestine'], color: 'bg-rose-600', textColor: 'text-rose-600' },
  { id: 'worry', label: 'Worry', organs: ['Spleen', 'Stomach'], color: 'bg-amber-500', textColor: 'text-amber-600' },
  { id: 'sadness', label: 'Sadness', organs: ['Lungs', 'Large Intestine'], color: 'bg-slate-500', textColor: 'text-slate-600' },
  { id: 'fear', label: 'Fear', organs: ['Kidneys', 'Bladder'], color: 'bg-blue-600', textColor: 'text-blue-600' },
  { id: 'anger', label: 'Anger', organs: ['Liver', 'Gallbladder'], color: 'bg-emerald-600', textColor: 'text-emerald-600' },
];

export const EYE_POSITIONS = [
  { id: 'v_mem', label: 'Visual Memory', sub: 'Are you visually seeing that memory?', pos: 'Up & Left' },
  { id: 'a_mem', label: 'Auditory Memory', sub: 'Can you hear the words or sounds?', pos: 'Horizontal Left' },
  { id: 'i_mon', label: 'Internal Monologue', sub: 'What are/were you saying to yourself?', pos: 'Down & Left' },
  { id: 'kin', label: 'Kinesthetic', sub: 'What did/do you feel in the body?', pos: 'Down & Right' },
  { id: 'a_con', label: 'Auditory Constructed', sub: 'What you think you are going to hear', pos: 'Horizontal Right' },
  { id: 'v_con', label: 'Visual Constructed', sub: 'What you think you are going to see', pos: 'Up & Right' },
];

// Legacy mappings for backward compatibility
export const CHANNEL_EMOTIONS: Record<string, string[]> = {
  'SI AND SJ': [...new Set([...(TCM_CHANNELS.find(c => c.id === 'SI')?.emotions || []), ...(TCM_CHANNELS.find(c => c.id === 'SJ')?.emotions || [])])],
  'HT AND PC': [...new Set([...(TCM_CHANNELS.find(c => c.id === 'HT')?.emotions || []), ...(TCM_CHANNELS.find(c => c.id === 'PC')?.emotions || [])])],
  'ST': TCM_CHANNELS.find(c => c.id === 'ST')?.emotions || [],
  'SP': TCM_CHANNELS.find(c => c.id === 'SP')?.emotions || [],
  'LI': TCM_CHANNELS.find(c => c.id === 'LI')?.emotions || [],
  'LU': TCM_CHANNELS.find(c => c.id === 'LU')?.emotions || [],
  'BL': TCM_CHANNELS.find(c => c.id === 'BL')?.emotions || [],
  'KI': TCM_CHANNELS.find(c => c.id === 'KI')?.emotions || [],
  'GB': TCM_CHANNELS.find(c => c.id === 'GB')?.emotions || [],
  'LIVER': TCM_CHANNELS.find(c => c.id === 'LV')?.emotions || [],
};

export const ELEMENT_EMOTIONS: Record<string, string[]> = {
  'FIRE': ['Joy', 'Love', 'Hate', 'Elation', 'In-Tune', 'Maturity', 'Harmony', 'Balance', 'Calm', 'Excited', 'Understanding', 'Openness', 'Agitation', 'Domineering', 'Emotional', 'Passion', 'Expression', 'Apathy', 'Propriety', 'Self-Love', 'Defensive', 'Heart', 'Boundaries', 'Individuality'],
  'EARTH': ['Worry', 'Contemplation', 'Centering', 'Satisfaction', 'Positive/Happy State Of Mind', 'Thinking', 'Analysis', 'Ingratiating', 'Giving/Receiving', 'Relationships', 'Dependence', 'Obligation', 'Support', 'Responsibility', 'Nuture', 'Nourish', 'Integrity', 'Sympathy', 'Empathy', 'Blame', 'Needy', 'Contentment'],
  'METAL': ['Sadness', 'Melancholy', 'Guilt', 'Regret', 'Value', 'Worthless', 'Loss', 'Death', 'Longing', 'Attachment', 'Inspiration', 'Alienation', 'Separation', 'Letting Go', 'Disconnection From Spirit', 'Transformation', 'Change', 'Acknowledged', 'Purity', 'Respect', 'Honour', 'Reverence'],
  'WATER': ['Fear', 'Anxiety', 'Trust', 'Faith', 'Safety', 'Security', 'Stillness', 'Can’t Rest', 'Withdrawal', 'Control', 'Will', 'Wisdom', 'Invisible', 'Clever', 'Knowledge', 'Destiny', 'Essence', 'Instincts', 'Impatient', 'Unrelenting', 'Core', 'Foundation', 'Potential'],
  'WOOD': ['Anger', 'Frustration', 'Rage', 'Resentment', 'Decisions', 'Acceptance', 'Rejection', 'Moving Forward', 'Choice', 'Stagnation', 'Stuck', 'Irritation', 'Uncertainty', 'Expectations', 'Freedom', 'Courage', 'Judgement', 'Hope', 'Perfection', 'Flow', 'Self-Esteem', 'Planning', 'Direction', 'Right', 'Wrong'],
};