import { MUSCLE_GROUPS, PRIMARY_14_MUSCLES } from "@/data/muscle-data";
import { ACUPOINTS } from "@/data/acupoint-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import { QUIZ_IMAGES } from "@/data/quiz-image-data";

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
  const categories = ['Anatomy', 'TCM', 'Clinical', 'Image'];
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
    default:
      return generateAnatomyQuestion();
  }
};

const generateAnatomyQuestion = (): Question => {
  const subType = Math.random() > 0.5 ? 'muscle' : 'nerve';
  
  if (subType === 'muscle') {
    const muscle = PRIMARY_14_MUSCLES[Math.floor(Math.random() * PRIMARY_14_MUSCLES.length)];
    const allMuscles = Object.values(MUSCLE_GROUPS).flat();
    
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
    const templates = ['function', 'nuclei', 'tone'];
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
    } else {
      return {
        id: `nerve-tone-${nerve.id}`,
        type: 'mcq',
        category: 'Anatomy',
        question: `What motor tone effect is associated with ${nerve.name}?`,
        options: getRandomOptions(nerve.toneEffect, ['Flexors', 'Extensors', 'None']),
        correctAnswer: nerve.toneEffect,
        explanation: `${nerve.name} is associated with ${nerve.toneEffect} tone.`
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
  const templates = ['stimulus', 'inhibition', 'sign'];
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
  } else {
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
