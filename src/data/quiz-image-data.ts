export interface QuizImage {
  id: string;
  url: string;
  label: string;
  category: 'Anatomy' | 'Clinical' | 'TCM' | 'Lymphatic';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export const QUIZ_IMAGES: QuizImage[] = [
  {
    id: 'cisterna-chyli',
    url: '/images/lymphatic/cisterna-chyli.png',
    label: 'Cisterna Chyli',
    category: 'Lymphatic',
    question: 'Identify this lymphatic structure located at the base of the thoracic duct.',
    options: ['Cisterna Chyli', 'Thoracic Duct', 'Right Lymphatic Duct', 'Inguinal Node'],
    correctAnswer: 'Cisterna Chyli',
    explanation: 'The Cisterna Chyli is a dilated sac at the lower end of the thoracic duct into which lymph from the intestinal trunk and two lumbar lymphatic trunks flow.'
  },
  {
    id: 'popliteal-nodes',
    url: '/images/lymphatic/popliteal.png',
    label: 'Popliteal Nodes',
    category: 'Lymphatic',
    question: 'Which lymphatic nodes are shown in this image, located behind the knee?',
    options: ['Inguinal Nodes', 'Popliteal Nodes', 'Axillary Nodes', 'Cervical Nodes'],
    correctAnswer: 'Popliteal Nodes',
    explanation: 'The popliteal lymph nodes are located in the fat of the popliteal fossa (behind the knee).'
  },
  {
    id: 'inguinal-nodes',
    url: '/images/lymphatic/inguinal.png',
    label: 'Inguinal Nodes',
    category: 'Lymphatic',
    question: 'Identify these lymph nodes located in the groin area.',
    options: ['Axillary Nodes', 'Inguinal Nodes', 'Maxillary Nodes', 'Popliteal Nodes'],
    correctAnswer: 'Inguinal Nodes',
    explanation: 'Inguinal lymph nodes are located in the groin and receive lymph from the lower limbs, external genitalia, and lower abdominal wall.'
  },
  {
    id: 'axillary-nodes',
    url: '/images/lymphatic/axillary.png',
    label: 'Axillary Nodes',
    category: 'Lymphatic',
    question: 'Which lymph nodes are highlighted in the armpit region?',
    options: ['Cervical Nodes', 'Axillary Nodes', 'Inguinal Nodes', 'Thoracic Nodes'],
    correctAnswer: 'Axillary Nodes',
    explanation: 'Axillary lymph nodes are located in the armpit and drain lymph from the upper limbs and breast.'
  },
  {
    id: 'fakuda-step-test',
    url: '/images/fakuda-step-test.png',
    label: 'Fakuda Step Test',
    category: 'Clinical',
    question: 'What clinical assessment is being performed in this image?',
    options: ['Romberg Test', 'Fakuda Step Test', 'Babinski Reflex', 'Moro Reflex'],
    correctAnswer: 'Fakuda Step Test',
    explanation: 'The Fukuda Step Test is used to assess vestibular function by having the patient march in place with eyes closed.'
  },
  {
    id: 'frontal-lobe-assessment',
    url: '/images/frontal-lobe-assessment.png',
    label: 'Frontal Lobe Assessment',
    category: 'Clinical',
    question: 'This image represents an assessment for which part of the brain?',
    options: ['Cerebellum', 'Occipital Lobe', 'Frontal Lobe', 'Brainstem'],
    correctAnswer: 'Frontal Lobe',
    explanation: 'Frontal lobe assessments often involve executive function, motor control, and specific cognitive tasks.'
  },
  {
    id: 'sharpened-rhombergs',
    url: '/images/sharpened-rhombergs-test.png',
    label: "Sharpened Romberg's Test",
    category: 'Clinical',
    question: "Identify this balance assessment where the patient stands heel-to-toe.",
    options: ["Standard Romberg's", "Sharpened Romberg's", "Tandem Gait", "Single Leg Stance"],
    correctAnswer: "Sharpened Romberg's",
    explanation: "The Sharpened Romberg's test (or Tandem Romberg) is a more challenging version of the Romberg test used to assess balance and proprioception."
  },
  {
    id: 'homunculus',
    url: '/images/mechanoreceptive/homunculus.png',
    label: 'Cortical Homunculus',
    category: 'Anatomy',
    question: 'What does this distorted human figure represent in neurology?',
    options: ['Skeletal System', 'Cortical Homunculus', 'Dermatomes', 'Myotomes'],
    correctAnswer: 'Cortical Homunculus',
    explanation: 'The cortical homunculus is a physical representation of the human body, located within the brain, showing how much of the cortex is dedicated to processing motor or sensory functions for different body parts.'
  }
];
