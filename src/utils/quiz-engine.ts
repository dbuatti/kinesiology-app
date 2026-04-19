import { MUSCLE_GROUPS, PRIMARY_14_MUSCLES } from "@/data/muscle-data";
import { ACUPOINTS } from "@/data/acupoint-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import { QUIZ_IMAGES } from "@/data/quiz-image-data";
import { PRIMARY_EMOTIONS, SIGNS_OF_SHIFT } from "@/data/emotion-data";

export type QuestionType = 'mcq' | 'fill-in-the-blank' | 'image' | 'flashcard';

export interface Question {
  id: string;
  type: QuestionType;
  category: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  imageUrl?: string;
}

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const getRandomOptions = (correct: string, allOptions: string[], count: number = 3): string[] => {
  const filtered = allOptions.filter(o => o !== correct);
  const shuffled = shuffleArray(filtered);
  return shuffleArray([correct, ...shuffled.slice(0, count)]);
};

export const generateQuestion = (): Question => {
  const categories = ['Anatomy', 'TCM', 'Clinical', 'Image', 'Methodology'];
  const category = categories[Math.floor(Math.random() * categories.length)];

  switch (category) {
    case 'Anatomy':
      return generateAnatomyQuestion();
    case 'TCM':
      return generateTCMQuestion();
    case 'Clinical':
      return generateClinicalQuestion();
    case 'Image':
      return generateImageQuestion();
    case 'Methodology':
      return generateMethodologyQuestion();
    default:
      return generateAnatomyQuestion();
  }
};

const generateAnatomyQuestion = (): Question => {
  const subType = Math.random() > 0.5 ? 'muscle' : 'nerve';
  
  if (subType === 'muscle') {
    const muscle = PRIMARY_14_MUSCLES[Math.floor(Math.random() * PRIMARY_14_MUSCLES.length)];
    
    return {
      id: `muscle-${Date.now()}`,
      type: 'mcq',
      category: 'Anatomy',
      question: `Which muscle group does the ${muscle} belong to?`,
      options: getRandomOptions(
        Object.keys(MUSCLE_GROUPS).find(key => MUSCLE_GROUPS[key].includes(muscle)) || 'Other',
        Object.keys(MUSCLE_GROUPS)
      ),
      correctAnswer: Object.keys(MUSCLE_GROUPS).find(key => MUSCLE_GROUPS[key].includes(muscle)) || 'Other',
      explanation: `${muscle} is part of the ${Object.keys(MUSCLE_GROUPS).find(key => MUSCLE_GROUPS[key].includes(muscle))} group.`
    };
  } else {
    const nerve = CRANIAL_NERVES[Math.floor(Math.random() * CRANIAL_NERVES.length)];
    const templates = ['function', 'nuclei', 'tone', 'identification'];
    const template = templates[Math.floor(Math.random() * templates.length)];

    if (template === 'function') {
      return {
        id: `nerve-func-${nerve.id}`,
        type: 'mcq',
        category: 'Anatomy',
        question: `What is a primary function of ${nerve.name} (${nerve.latinName})?`,
        options: getRandomOptions(
          nerve.functions[0],
          CRANIAL_NERVES.flatMap(n => n.functions)
        ),
        correctAnswer: nerve.functions[0],
        explanation: `${nerve.name} is responsible for: ${nerve.functions.join(', ')}.`
      };
    } else if (template === 'nuclei') {
      return {
        id: `nerve-nuclei-${nerve.id}`,
        type: 'mcq',
        category: 'Anatomy',
        question: `Where are the nuclei for ${nerve.name} located?`,
        options: getRandomOptions(nerve.nuclei, ['Cortex', 'Midbrain', 'Pons', 'Medulla']),
        correctAnswer: nerve.nuclei,
        explanation: `The nuclei for ${nerve.name} are located in the ${nerve.nuclei}.`
      };
    } else if (template === 'tone') {
      return {
        id: `nerve-tone-${nerve.id}`,
        type: 'mcq',
        category: 'Anatomy',
        question: `What motor tone effect is associated with ${nerve.name}?`,
        options: getRandomOptions(nerve.toneEffect, ['Flexors', 'Extensors', 'None']),
        correctAnswer: nerve.toneEffect,
        explanation: `${nerve.name} is associated with ${nerve.toneEffect} tone.`
      };
    } else {
      // Identification Template
      return {
        id: `nerve-id-${nerve.id}`,
        type: 'mcq',
        category: 'Anatomy',
        question: `Which cranial nerve is responsible for ${nerve.functions.join(' and ')}?`,
        options: getRandomOptions(nerve.name, CRANIAL_NERVES.map(n => n.name)),
        correctAnswer: nerve.name,
        explanation: `${nerve.name} (${nerve.latinName}) handles these functions and is housed in the ${nerve.nuclei}.`
      };
    }
  }
};

const generateTCMQuestion = (): Question => {
  const subType = Math.random() > 0.5 ? 'acupoint' : 'channel';

  if (subType === 'acupoint') {
    const point = ACUPOINTS[Math.floor(Math.random() * ACUPOINTS.length)];
    const templates = ['location', 'function'];
    const template = templates[Math.floor(Math.random() * templates.length)];

    if (template === 'location') {
      return {
        id: `acu-loc-${point.code}`,
        type: 'mcq',
        category: 'TCM',
        question: `Where is the acupoint ${point.code} (${point.name}) located?`,
        options: getRandomOptions(point.location, ACUPOINTS.map(p => p.location)),
        correctAnswer: point.location,
        explanation: `${point.code} is located: ${point.location}`
      };
    } else {
      return {
        id: `acu-func-${point.code}`,
        type: 'mcq',
        category: 'TCM',
        question: `What is the primary function of ${point.code} (${point.name})?`,
        options: getRandomOptions(point.function, ACUPOINTS.map(p => p.function)),
        correctAnswer: point.function,
        explanation: `${point.code} is used for: ${point.function}`
      };
    }
  } else {
    const channel = TCM_CHANNELS[Math.floor(Math.random() * TCM_CHANNELS.length)];
    const templates = ['element', 'time', 'muscle'];
    const template = templates[Math.floor(Math.random() * templates.length)];

    if (template === 'element') {
      return {
        id: `chan-elem-${channel.code}`,
        type: 'mcq',
        category: 'TCM',
        question: `Which element is the ${channel.name} channel associated with?`,
        options: getRandomOptions(channel.element, ['Wood', 'Fire', 'Earth', 'Metal', 'Water']),
        correctAnswer: channel.element,
        explanation: `The ${channel.name} channel belongs to the ${channel.element} element.`
      };
    } else if (template === 'time') {
      return {
        id: `chan-time-${channel.code}`,
        type: 'mcq',
        category: 'TCM',
        question: `What is the peak time for the ${channel.name} channel?`,
        options: getRandomOptions(channel.peakTime, TCM_CHANNELS.map(c => c.peakTime)),
        correctAnswer: channel.peakTime,
        explanation: `The ${channel.name} channel is most active during ${channel.peakTime}.`
      };
    } else {
      const muscle = channel.muscles[0];
      return {
        id: `chan-musc-${channel.code}`,
        type: 'mcq',
        category: 'TCM',
        question: `Which channel is the ${muscle} muscle associated with?`,
        options: getRandomOptions(channel.name, TCM_CHANNELS.map(c => c.name)),
        correctAnswer: channel.name,
        explanation: `The ${muscle} is associated with the ${channel.name} channel.`
      };
    }
  }
};

const generateClinicalQuestion = (): Question => {
  const reflex = PRIMITIVE_REFLEXES[Math.floor(Math.random() * PRIMITIVE_REFLEXES.length)];
  const templates = ['stimulus', 'inhibition', 'sign', 'identification'];
  const template = templates[Math.floor(Math.random() * templates.length)];

  if (template === 'stimulus') {
    return {
      id: `reflex-stim-${reflex.id}`,
      type: 'mcq',
      category: 'Clinical',
      question: `What is the stimulus for the ${reflex.name} reflex?`,
      options: getRandomOptions(reflex.stimulus, PRIMITIVE_REFLEXES.map(r => r.stimulus)),
      correctAnswer: reflex.stimulus,
      explanation: `The ${reflex.name} reflex is triggered by: ${reflex.stimulus}`
    };
  } else if (template === 'inhibition') {
    return {
      id: `reflex-inhib-${reflex.id}`,
      type: 'mcq',
      category: 'Clinical',
      question: `What is the inhibition pattern for the ${reflex.name} reflex?`,
      options: getRandomOptions(reflex.inhibitionPattern, PRIMITIVE_REFLEXES.map(r => r.inhibitionPattern)),
      correctAnswer: reflex.inhibitionPattern,
      explanation: `When the ${reflex.name} reflex is active, the pattern is: ${reflex.inhibitionPattern}`
    };
  } else if (template === 'sign') {
    const sign = reflex.clinicalSigns?.[0] || "Developmental issues";
    return {
      id: `reflex-sign-${reflex.id}`,
      type: 'mcq',
      category: 'Clinical',
      question: `Which of these is a clinical sign of a retained ${reflex.name} reflex?`,
      options: getRandomOptions(sign, PRIMITIVE_REFLEXES.flatMap(r => r.clinicalSigns || [])),
      correctAnswer: sign,
      explanation: `Retained ${reflex.name} can manifest as: ${reflex.clinicalSigns?.join(', ')}.`
    };
  } else {
    // Identification Template
    return {
      id: `reflex-id-${reflex.id}`,
      type: 'mcq',
      category: 'Clinical',
      question: `Which reflex is triggered by ${reflex.stimulus} and results in ${reflex.inhibitionPattern}?`,
      options: getRandomOptions(reflex.name, PRIMITIVE_REFLEXES.map(r => r.name)),
      correctAnswer: reflex.name,
      explanation: `This describes the ${reflex.name} reflex, which is part of the ${reflex.category} category.`
    };
  }
};

const generateImageQuestion = (): Question => {
  const image = QUIZ_IMAGES[Math.floor(Math.random() * QUIZ_IMAGES.length)];
  return {
    id: `image-${image.id}`,
    type: 'image',
    category: image.category,
    question: image.question,
    options: image.options,
    correctAnswer: image.correctAnswer,
    explanation: image.explanation,
    imageUrl: image.url
  };
};

const generateMethodologyQuestion = (): Question => {
  const templates = ['peace', 'hierarchy', 'sns', 'nei', 'shift'];
  const template = templates[Math.floor(Math.random() * templates.length)];

  if (template === 'peace') {
    const steps = [
      { l: 'P', n: 'Preliminary Assessment' },
      { l: 'E', n: 'Ease the System' },
      { l: 'A', n: 'Align the Hierarchy' },
      { l: 'C', n: 'Correct' },
      { l: 'E', n: 'Embed' }
    ];
    const step = steps[Math.floor(Math.random() * steps.length)];
    return {
      id: `peace-${step.l}-${Date.now()}`,
      type: 'mcq',
      category: 'Methodology',
      question: `In the PEACE process, what does the '${step.l}' stand for?`,
      options: getRandomOptions(step.n, steps.map(s => s.n)),
      correctAnswer: step.n,
      explanation: `The PEACE process stands for: Preliminary Assessment, Ease the System, Align the Hierarchy, Correct, and Embed.`
    };
  } else if (template === 'hierarchy') {
    const tiers = [
      { t: 'Asterisk Tier', i: 'Emotional Charge' },
      { t: 'Primary Tier', i: 'Primitive Reflexes' },
      { t: 'Secondary Tier', i: 'Immune Vials' },
      { t: 'Tertiary Tier', i: 'Ileocecal Valve' }
    ];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    return {
      id: `hierarchy-${tier.t}-${Date.now()}`,
      type: 'mcq',
      category: 'Methodology',
      question: `Which clinical finding belongs to the ${tier.t}?`,
      options: getRandomOptions(tier.i, tiers.map(t => t.i)),
      correctAnswer: tier.i,
      explanation: `The clinical hierarchy organizes findings into tiers: Asterisk (Energetic), Primary (Neural), Secondary (Immune), and Tertiary (Structural).`
    };
  } else if (template === 'sns') {
    const resets = [
      { n: 'T1 Sympathetic Reset', p: 'External rotation of the shoulder' },
      { n: 'Diaphragm Reset', p: 'Moving ribcage superiorly towards neck' },
      { n: 'Vagus Nerve Process', p: 'Medulla Breathing (Blocked Inhale/Forced Exhale)' }
    ];
    const reset = resets[Math.floor(Math.random() * resets.length)];
    return {
      id: `sns-${Date.now()}`,
      type: 'mcq',
      category: 'Methodology',
      question: `What is a key correction step in the ${reset.n}?`,
      options: getRandomOptions(reset.p, resets.map(r => r.p)),
      correctAnswer: reset.p,
      explanation: `The ${reset.n} protocol involves ${reset.p} to down-regulate the sympathetic nervous system.`
    };
  } else if (template === 'nei') {
    const emotions = PRIMARY_EMOTIONS;
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    return {
      id: `nei-emo-${emotion.id}`,
      type: 'mcq',
      category: 'Methodology',
      question: `In Neuro-Emotional Integration, which organs are associated with the emotion '${emotion.label}'?`,
      options: getRandomOptions(emotion.organs.join(', '), emotions.map(e => e.organs.join(', '))),
      correctAnswer: emotion.organs.join(', '),
      explanation: `${emotion.label} is associated with the ${emotion.organs.join(' and ')} in the ${emotion.element} element.`
    };
  } else {
    const shift = SIGNS_OF_SHIFT[Math.floor(Math.random() * SIGNS_OF_SHIFT.length)];
    return {
      id: `shift-${Date.now()}`,
      type: 'mcq',
      category: 'Methodology',
      question: `Which of these is a recognized sign of a neurological shift during a session?`,
      options: getRandomOptions(shift, ['Increased heart rate', 'Muscle cramping', 'Sudden headache', 'Cold sweat']),
      correctAnswer: shift,
      explanation: `Signs of a parasympathetic shift include: ${SIGNS_OF_SHIFT.join(', ')}.`
    };
  }
};