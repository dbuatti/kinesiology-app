export interface LuscherCombinationResult {
  bachFlower: string;
  qualities: string;
  pattern: string;
  lesson: string;
  affirmation: string;
}

export const LUSCHER_COLORS: Record<string, { name: string, hex: string }> = {
  '0': { name: 'Grey', hex: '#94a3b8' },
  '1': { name: 'Blue', hex: '#3b82f6' },
  '2': { name: 'Green', hex: '#10b981' },
  '3': { name: 'Red', hex: '#ef4444' },
  '4': { name: 'Yellow', hex: '#f59e0b' },
  '5': { name: 'Violet', hex: '#8b5cf6' },
  '6': { name: 'Brown', hex: '#78350f' },
  '7': { name: 'Black', hex: '#0f172a' },
};

export const LUSCHER_COMBINATIONS: Record<string, LuscherCombinationResult> = {
  "01": { 
    bachFlower: "Impatiens", 
    qualities: "Restless dissatisfaction", 
    pattern: "Being impatient, especially with others, but also with self; wanting to rush growth",
    lesson: "Patience and acceptance of the natural flow of time and the pace of others.",
    affirmation: "I am at peace with the pace of life and allow things to unfold in their own time."
  },
  "02": { 
    bachFlower: "Agrimony", 
    qualities: "Unresolved pressure", 
    pattern: "Separation between inner and outer world. Feeling that love and acceptance must be earned, fear of showing our inner selves.",
    lesson: "Honesty with oneself and the courage to express true feelings without the mask of cheerfulness.",
    affirmation: "I find peace within and express my true self with ease and authenticity."
  },
  "03": { 
    bachFlower: "Gorse", 
    qualities: "Helpless irritability", 
    pattern: "Seeing life as full of suffering, or else denying aspects of life in order to avoid pain; having feeling of despair",
    lesson: "Restoring hope and faith, even when circumstances seem difficult.",
    affirmation: "I look forward with hope and trust that everything is working for my highest good."
  },
  "04": { 
    bachFlower: "Scleranthus", 
    qualities: "Apprehensive Insecurity", 
    pattern: "Wavering between two polarities (mentally or emotionally); facing a decision between two choices",
    lesson: "Developing inner balance and the ability to make clear, intuitive decisions.",
    affirmation: "I am centered and balanced, making choices with clarity and confidence."
  },
  "05": { 
    bachFlower: "Rock Water", 
    qualities: "Controlled responsiveness", 
    pattern: "Extreme self-discipline or self-denial; martyrdom; imposing ideas of discipline on ourselves",
    lesson: "Flexibility of mind and the ability to be gentle and kind to oneself.",
    affirmation: "I flow with the rhythm of life and allow myself to be flexible and joyful."
  },
  "06": { 
    bachFlower: "Beech", 
    qualities: "Intolerance, critical, judgmental.", 
    pattern: "Over-identification with the environment and people that are near; judgement and criticism of environment and others",
    lesson: "Tolerance, empathy, and seeing the beauty and perfection in all things and people.",
    affirmation: "I see the good in all things and accept others exactly as they are."
  },
  "07": { 
    bachFlower: "Heather", 
    qualities: "Wants to be self-determining", 
    pattern: "Focus on self love in terms of fulfilling personality needs",
    lesson: "Self-sufficiency and the ability to listen deeply to others with true empathy.",
    affirmation: "I am whole within myself and open my heart to the needs of others."
  },
  "10": { 
    bachFlower: "Impatiens", 
    qualities: "Impatience, irritability, extreme mental tension", 
    pattern: "Being impatient, especially with others, but also with self; wanting to rush growth",
    lesson: "Patience and acceptance of the natural flow of time.",
    affirmation: "I am at peace with the pace of life."
  },
  "12": { 
    bachFlower: "Impatiens", 
    qualities: "Impatience, irritability, extreme mental tension", 
    pattern: "Being impatient, especially with others, but also with self; wanting to rush growth",
    lesson: "Patience and acceptance of the natural flow of time.",
    affirmation: "I am at peace with the pace of life."
  },
  "13": { 
    bachFlower: "Gorse", 
    qualities: "Hopelessness despair", 
    pattern: "Seeing life as full of suffering, or else denying aspects of life in order to avoid pain; having feeling of despair",
    lesson: "Restoring hope and faith.",
    affirmation: "I look forward with hope and trust."
  },
  "14": { 
    bachFlower: "Elm", 
    qualities: "Stress from emotional disappointment", 
    pattern: "Having rigid concepts of perfection as something absolute and therefore unobtainable; for stress of trying to live up to idealized image of self",
    lesson: "Maintaining perspective and recognizing when to rest and delegate responsibility.",
    affirmation: "I handle my responsibilities with ease and trust in my own capabilities."
  },
  "15": { 
    bachFlower: "Impatiens", 
    qualities: "Impatience from long-term misunderstanding", 
    pattern: "Being impatient, especially with others, but also with self; wanting to rush growth",
    lesson: "Patience and acceptance of the natural flow of time.",
    affirmation: "I am at peace with the pace of life."
  },
  "16": { 
    bachFlower: "Rock Water", 
    qualities: "Self-denial, repression, martyrdom", 
    pattern: "Extreme self-discipline or self-denial; martyrdom; imposing ideas of discipline on ourselves",
    lesson: "Flexibility and self-kindness.",
    affirmation: "I flow with life and am gentle with myself."
  },
  "17": { 
    bachFlower: "Mimulus", 
    qualities: "Fear or anxiety of known origin", 
    pattern: "Fear of limitation and separation; fear of being trapped in form; fear of anything that can be identified; fear of being on Earth",
    lesson: "Courage and understanding the nature of fear as a tool for growth.",
    affirmation: "I face life with courage and confidence, knowing I am safe."
  },
  "20": { 
    bachFlower: "Scleranthus", 
    qualities: "Uncertainty, indecision, unbalanced", 
    pattern: "Wavering between two polarities (mentally or emotionally); facing a decision between two choices",
    lesson: "Balance and decisive inner guidance.",
    affirmation: "I am centered and make clear choices."
  },
  "21": { 
    bachFlower: "Agrimony", 
    qualities: "Concealed mental torture, worry", 
    pattern: "Separation between inner and outer world. Feeling that love and acceptance must be earned, fear of showing our inner selves.",
    lesson: "Inner peace and honest self-expression.",
    affirmation: "I find peace within and express my true self."
  },
  "23": { 
    bachFlower: "Vervain", 
    qualities: "Strain, stress, over enthusiasm", 
    pattern: "Using personal will and personal ideology to define the nature of reality; seeking to convert others to personal belief system",
    lesson: "Moderation, relaxation, and respecting the paths and beliefs of others.",
    affirmation: "I am calm and allow others to follow their own truth."
  },
  "24": { 
    bachFlower: "Wild Oat", 
    qualities: "Uncertainty, despondency, dissatisfaction", 
    pattern: "Lack of focus; inability to express purpose in life, or to align purpose and livelihood",
    lesson: "Clarity of purpose and finding one's true vocation in life.",
    affirmation: "I am clear about my path and purpose."
  },
  "25": { 
    bachFlower: "Chestnut Bud", 
    qualities: "Failure to learn from experience", 
    pattern: "Getting stuck in the same recurring situations or behaviors",
    lesson: "Learning from life's experiences and gaining wisdom from the past.",
    affirmation: "I learn from every situation and move forward with wisdom."
  },
  "26": { 
    bachFlower: "Elm", 
    qualities: "Stubborn ineffectual demand for esteem", 
    pattern: "Having rigid concepts of perfection as something absolute and therefore unobtainable; for stress of trying to live up to idealized image of self",
    lesson: "Perspective and self-care.",
    affirmation: "I handle my tasks with ease and grace."
  },
  "27": { 
    bachFlower: "Heather", 
    qualities: "Frustrated desire for independence and freedom", 
    pattern: "Focus on self love in terms of fulfilling personality needs",
    lesson: "Self-sufficiency and empathetic listening.",
    affirmation: "I am whole within myself and open to others."
  },
  "30": { 
    bachFlower: "Cherry Plum", 
    qualities: "Desperation, fear of losing control & doing something awful", 
    pattern: "Ego fear of losing control when shifting intuitive directing of life; mental questioning resistance to inner guidance",
    lesson: "Trust in the higher self and maintaining mental calm under pressure.",
    affirmation: "I am calm, composed, and trust my inner guidance."
  },
  "31": { 
    bachFlower: "Scleranthus", 
    qualities: "Uncertainty, indecision, despondency", 
    pattern: "Wavering between two polarities (mentally or emotionally); facing a decision between two choices",
    lesson: "Balance and decisive inner guidance.",
    affirmation: "I am centered and make clear choices."
  },
  "32": { 
    bachFlower: "Crab Apple", 
    qualities: "Cleansing from pollution of any sort", 
    pattern: "Having a need or desire for release and detoxification on any or all levels (mental, emotional, physical, spiritual); feeling unclean",
    lesson: "Self-acceptance and recognizing inner purity regardless of external factors.",
    affirmation: "I accept myself completely and am clean within."
  },
  "34": { 
    bachFlower: "Vine", 
    qualities: "Dominating, inflexible, ambitious", 
    pattern: "Extending personal authority to include authority over others; seeking to be \"helpful - to others by directing their activities",
    lesson: "Service and leadership through love and respect for others' free will.",
    affirmation: "I lead with love and respect for the path of others."
  },
  "35": { 
    bachFlower: "Rock Water", 
    qualities: "Frustration from attempts to attain security", 
    pattern: "Extreme self-discipline or self-denial; martyrdom; imposing ideas of discipline on ourselves",
    lesson: "Flexibility and self-kindness.",
    affirmation: "I flow with life and am gentle with myself."
  },
  "36": { 
    bachFlower: "Elm", 
    qualities: "Insecurity from lack of allies", 
    pattern: "Having rigid concepts of perfection as something absolute and therefore unobtainable; for stress of trying to live up to idealized image of self",
    lesson: "Perspective and self-care.",
    affirmation: "I handle my tasks with ease and grace."
  },
  "33": { 
    bachFlower: "Vervain", 
    qualities: "Strain, stress, over enthusiasm", 
    pattern: "Using personal will and personal ideology to define the nature of reality; seeking to convert others to personal belief system",
    lesson: "Moderation and respecting others' paths.",
    affirmation: "I am calm and allow others their own truth."
  },
  "37": { 
    bachFlower: "Impatiens", 
    qualities: "Impatience, irritability, extreme mental tension", 
    pattern: "Being impatient, especially with others, but also with self; wanting to rush growth",
    lesson: "Patience and acceptance of the natural flow of time.",
    affirmation: "I am at peace with the pace of life."
  },
  "40": { 
    bachFlower: "Aspen", 
    qualities: "Vague fears of unknown origin", 
    pattern: "Fear of what is not measurable by the senses or the mind; fear that is subconscious enough to not be connected with its source; fear that is picked up from others and from environment",
    lesson: "Trust in the unknown and developing a sense of inner security and protection.",
    affirmation: "I am safe and protected in all dimensions of my being."
  },
  "41": { 
    bachFlower: "Elm", 
    qualities: "Stress arising from emotional disappointment", 
    pattern: "Having rigid concepts of perfection as something absolute and therefore unobtainable; for stress of trying to live up to idealized image of self",
    lesson: "Perspective and self-care.",
    affirmation: "I handle my tasks with ease and grace."
  },
  "42": { 
    bachFlower: "Wild Oat", 
    qualities: "Frustrated vacillation of choices", 
    pattern: "Lack of focus; inability to express purpose in life, or to align purpose and livelihood",
    lesson: "Clarity of purpose and vocation.",
    affirmation: "I am clear about my path and purpose."
  },
  "43": { 
    bachFlower: "Vine", 
    qualities: "Unrealistic justification, victim", 
    pattern: "Extending personal authority to include authority over others; seeking to be \"helpful - to others by directing their activities",
    lesson: "Service and leadership through love.",
    affirmation: "I lead with love and respect for others' will."
  },
  "45": { 
    bachFlower: "Scleranthus", 
    qualities: "Emotional disappointment leading to suspicion and distrust", 
    pattern: "Wavering between two polarities (mentally or emotionally); facing a decision between two choices",
    lesson: "Balance and decisive inner guidance.",
    affirmation: "I am centered and make clear choices."
  },
  "46": { 
    bachFlower: "Water Violet", 
    qualities: "Disappointment leading to indifference and withdrawal.", 
    pattern: "Feeling separate or aloof from other people, although very strong and centered within self",
    lesson: "Connection and sharing one's wisdom and presence with others.",
    affirmation: "I am connected to others while remaining centered in my own truth."
  },
  "47": { 
    bachFlower: "Rock Water", 
    qualities: "Watchful and retentive", 
    pattern: "Extreme self-discipline or self-denial; martyrdom; imposing ideas of discipline on ourselves",
    lesson: "Flexibility and self-kindness.",
    affirmation: "I flow with life and am gentle with myself."
  },
  "50": { 
    bachFlower: "Rock Water", 
    qualities: "Self-denial, repression, martyr", 
    pattern: "Extreme self-discipline or self-denial; martyrdom; imposing ideas of discipline on ourselves",
    lesson: "Flexibility and self-kindness.",
    affirmation: "I flow with life and am gentle with myself."
  },
  "51": { 
    bachFlower: "Impatiens", 
    qualities: "Impatience, irritability and extreme tension", 
    pattern: "Being impatient, especially with others, but also with self; wanting to rush growth",
    lesson: "Patience and acceptance of the natural flow of time.",
    affirmation: "I am at peace with the pace of life."
  },
  "52": { 
    bachFlower: "Chestnut Bud", 
    qualities: "Failure to learn from experiences", 
    pattern: "Getting stuck in the same recurring situations or behaviors",
    lesson: "Learning from life's experiences.",
    affirmation: "I learn from every situation and move forward."
  },
  "53": { 
    bachFlower: "Vervain", 
    qualities: "Stress, strain, tension, trying too hard.", 
    pattern: "Using personal will and personal ideology to define the nature of reality; seeking to convert others to personal belief system",
    lesson: "Moderation and respecting others' paths.",
    affirmation: "I am calm and allow others their own truth."
  },
  "54": { 
    bachFlower: "Gentian", 
    qualities: "Doubt, depression, discouragement", 
    pattern: "Creating negative realities through our negative projections; becoming discouraged and depressed by aspects of our lives",
    lesson: "Perseverance and maintaining a positive outlook despite setbacks.",
    affirmation: "I see every obstacle as an opportunity for growth and learning."
  },
  "56": { 
    bachFlower: "Water Violet", 
    qualities: "Pride, aloofness", 
    pattern: "Feeling separate or aloof from other people, although very strong and centered within self",
    lesson: "Connection and sharing wisdom.",
    affirmation: "I am connected to others while remaining centered."
  },
  "57": { 
    bachFlower: "Heather", 
    qualities: "Demands independence, straight dealing", 
    pattern: "Focus on self love in terms of fulfilling personality needs",
    lesson: "Self-sufficiency and empathetic listening.",
    affirmation: "I am whole within myself and open to others."
  },
  "60": { 
    bachFlower: "Elm", 
    qualities: "Demands esteem as an exceptional individual", 
    pattern: "Having rigid concepts of perfection as something absolute and therefore unobtainable; for stress of trying to live up to idealized image of self",
    lesson: "Perspective and self-care.",
    affirmation: "I handle my tasks with ease and grace."
  },
  "61": { 
    bachFlower: "Elm", 
    qualities: "Discontent from lack of appreciation, undue self-restraint", 
    pattern: "Having rigid concepts of perfection as something absolute and therefore unobtainable; for stress of trying to live up to idealized image of self",
    lesson: "Perspective and self-care.",
    affirmation: "I handle my tasks with ease and grace."
  },
  "62": { 
    bachFlower: "Elm", 
    qualities: "Stubborn but ineffectual desire for esteem", 
    pattern: "Having rigid concepts of perfection as something absolute and therefore unobtainable; for stress of trying to live up to idealized image of self",
    lesson: "Perspective and self-care.",
    affirmation: "I handle my tasks with ease and grace."
  },
  "63": { 
    bachFlower: "Elm", 
    qualities: "Insecurity arising from lack of allies", 
    pattern: "Having rigid concepts of perfection as something absolute and therefore unobtainable; for stress of trying to live up to idealized image of self",
    lesson: "Perspective and self-care.",
    affirmation: "I handle my tasks with ease and grace."
  },
  "64": { 
    bachFlower: "Water Violet", 
    qualities: "Disappointment leading to assumed air of indifference", 
    pattern: "Feeling separate or aloof from other people, although very strong and centered within self",
    lesson: "Connection and sharing wisdom.",
    affirmation: "I am connected to others while remaining centered."
  },
  "65": { 
    bachFlower: "Rock Water", 
    qualities: "Sublimated artistic sensitivity", 
    pattern: "Extreme self-discipline or self-denial; martyrdom; imposing ideas of discipline on ourselves",
    lesson: "Flexibility and self-kindness.",
    affirmation: "I flow with life and am gentle with myself."
  },
  "67": { 
    bachFlower: "Heather", 
    qualities: "Desire to control one's own destiny", 
    pattern: "Focus on self love in terms of fulfilling personality needs",
    lesson: "Self-sufficiency and empathetic listening.",
    affirmation: "I am whole within myself and open to others."
  },
  "70": { 
    bachFlower: "Vervain", 
    qualities: "Strain, stress tension, over-enthusiasm", 
    pattern: "Using personal will and personal ideology to define the nature of reality; seeking to convert others to personal belief system",
    lesson: "Moderation and respecting others' paths.",
    affirmation: "I am calm and allow others their own truth."
  },
  "71": { 
    bachFlower: "Mimulus", 
    qualities: "Fear or anxiety of known origin", 
    pattern: "Fear of limitation and separation; fear of being trapped in form; fear of anything that can be identified; fear of being on Earth",
    lesson: "Courage and understanding fears.",
    affirmation: "I face life with courage and confidence."
  },
  "72": { 
    bachFlower: "Heather", 
    qualities: "Frustrated desire for independence and freedom of action", 
    pattern: "Focus on self love in terms of fulfilling personality needs",
    lesson: "Self-sufficiency and empathetic listening.",
    affirmation: "I am whole within myself and open to others."
  },
  "73": { 
    bachFlower: "Heather", 
    qualities: "Frustrated desire for independence", 
    pattern: "Focus on self love in terms of fulfilling personality needs",
    lesson: "Self-sufficiency and empathetic listening.",
    affirmation: "I am whole within myself and open to others."
  },
  "74": { 
    bachFlower: "Heather", 
    qualities: "Demand for shared independence", 
    pattern: "Focus on self love in terms of fulfilling personality needs",
    lesson: "Self-sufficiency and empathetic listening.",
    affirmation: "I am whole within myself and open to others."
  },
  "75": { 
    bachFlower: "Heather", 
    qualities: "Demand for shared independence", 
    pattern: "Focus on self love in terms of fulfilling personality needs",
    lesson: "Self-sufficiency and empathetic listening.",
    affirmation: "I am whole within myself and open to others."
  },
  "76": { 
    bachFlower: "Elm", 
    qualities: "Occasional feelings of inadequacy, despondency, long-term exhaustion from striving for perfection.", 
    pattern: "Having rigid concepts of perfection as something absolute and therefore unobtainable; for stress of trying to live up to idealized image of self",
    lesson: "Perspective and self-care.",
    affirmation: "I handle my tasks with ease and grace."
  },
};