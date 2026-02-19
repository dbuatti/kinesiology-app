import { TCM_CHANNELS, TcmElement } from "./tcm-channel-data";

// Derived from the central database for backward compatibility with existing components
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

// 5 Element Emotions (Static for now as they represent the archetypal element state)
export const ELEMENT_EMOTIONS: Record<string, string[]> = {
  'FIRE': ['Joy', 'Love', 'Hate', 'Elation', 'In-Tune', 'Maturity', 'Harmony', 'Balance', 'Calm', 'Excited', 'Understanding', 'Openness', 'Agitation', 'Domineering', 'Emotional', 'Passion', 'Expression', 'Apathy', 'Propriety', 'Self-Love', 'Defensive', 'Heart', 'Boundaries', 'Individuality'],
  'EARTH': ['Worry', 'Contemplation', 'Centering', 'Satisfaction', 'Positive/Happy State Of Mind', 'Thinking', 'Analysis', 'Ingratiating', 'Giving/Receiving', 'Relationships', 'Dependence', 'Obligation', 'Support', 'Responsibility', 'Nuture', 'Nourish', 'Integrity', 'Sympathy', 'Empathy', 'Blame', 'Needy', 'Contentment'],
  'METAL': ['Sadness', 'Melancholy', 'Guilt', 'Regret', 'Value', 'Worthless', 'Loss', 'Death', 'Longing', 'Attachment', 'Inspiration', 'Alienation', 'Separation', 'Letting Go', 'Disconnection From Spirit', 'Transformation', 'Change', 'Acknowledged', 'Purity', 'Respect', 'Honour', 'Reverence'],
  'WATER': ['Fear', 'Anxiety', 'Trust', 'Faith', 'Safety', 'Security', 'Stillness', 'Can’t Rest', 'Withdrawal', 'Control', 'Will', 'Wisdom', 'Invisible', 'Clever', 'Knowledge', 'Destiny', 'Essence', 'Instincts', 'Impatient', 'Unrelenting', 'Core', 'Foundation', 'Potential'],
  'WOOD': ['Anger', 'Frustration', 'Rage', 'Resentment', 'Decisions', 'Acceptance', 'Rejection', 'Moving Forward', 'Choice', 'Stagnation', 'Stuck', 'Irritation', 'Uncertainty', 'Expectations', 'Freedom', 'Courage', 'Judgement', 'Hope', 'Perfection', 'Flow', 'Self-Esteem', 'Planning', 'Direction', 'Right', 'Wrong'],
};