"use client";

export interface MechanoFlashcard {
  id: string;
  question: string;
  answer: string;
  category: 'Theory' | 'Conscious' | 'Unconscious' | 'Clinical';
}

export interface MechanoResource {
  title: string;
  description: string;
  url: string;
  type: 'Video' | 'Article' | 'Course' | 'Research';
  source: string;
}

export const MECHANO_FLASHCARDS: MechanoFlashcard[] = [
  {
    id: '1',
    category: 'Theory',
    question: "What percentage of afferent input is processed unconsciously by the cerebellum?",
    answer: "85%. This travels via the Spinocerebellar tracts."
  },
  {
    id: '2',
    category: 'Theory',
    question: "Which pathway handles the 15% of conscious proprioceptive input?",
    answer: "The DCML (Dorsal Column Medial Lemniscus) pathway, projecting to the contralateral Sensory Cortex (S1)."
  },
  {
    id: '3',
    category: 'Conscious',
    question: "What is the lateralization logic for a Conscious Mechanoreceptive correction?",
    answer: "Contralateral. If the left side is dysfunctional, you hold the right-side brain representations (M1/S1)."
  },
  {
    id: '4',
    category: 'Unconscious',
    question: "What is the primary reflex point used for Unconscious Mechanoreceptive corrections?",
    answer: "GV16 (base of the skull/cerebellum). It follows Ipsilateral logic."
  },
  {
    id: '5',
    category: 'Clinical',
    question: "What effort level and duration is required for a Conscious isometric correction?",
    answer: "30-40% effort for 30-90 seconds, always with nasal breathing."
  },
  {
    id: '6',
    category: 'Unconscious',
    question: "How do you stimulate an Unconscious Mechanoreceptive correction?",
    answer: "Stretch the priority ligament/tendon while holding GV16, then apply a tuning fork to the cranium or tap for 3-5 seconds."
  },
  {
    id: '7',
    category: 'Theory',
    question: "What is the 'Rule of Action' in Functional Neurology?",
    answer: "Joints act, muscles and tissues react. The cerebellum prioritizes joint action over individual muscle status."
  },
  {
    id: '8',
    category: 'Clinical',
    question: "If an X-pattern facilitates a previously inhibited IM, what does this indicate?",
    answer: "A Mechanoreceptive priority (Afferent Bottom-Up)."
  }
];

export const MECHANO_RESOURCES: MechanoResource[] = [
  {
    title: "The DCML Pathway Explained",
    description: "A deep dive into the conscious proprioceptive pathway and its role in motor control.",
    url: "https://www.youtube.com/results?search_query=DCML+pathway+neurology",
    type: "Video",
    source: "YouTube Education"
  },
  {
    title: "Spinocerebellar Tracts & Cerebellum",
    description: "Understanding how 85% of your movement data is processed without you knowing it.",
    url: "https://www.youtube.com/results?search_query=spinocerebellar+tracts+cerebellum",
    type: "Video",
    source: "YouTube Education"
  },
  {
    title: "Z-Health: Applied Functional Neurology",
    description: "Practical drills and joint-by-joint mobility assessments based on brain-first principles.",
    url: "https://zhealtheducation.com/blog/",
    type: "Article",
    source: "Z-Health"
  },
  {
    title: "Carrick Institute: Clinical Neuro",
    description: "The gold standard for Functional Neurology research and clinical applications.",
    url: "https://carrickinstitute.com/research/",
    type: "Research",
    source: "Carrick Institute"
  },
  {
    title: "Proprioception & Chronic Pain",
    description: "Research on how 'smudged' sensory maps lead to chronic pain and how to fix them.",
    url: "https://pubmed.ncbi.nlm.nih.gov/?term=proprioception+chronic+pain+rehabilitation",
    type: "Research",
    source: "PubMed"
  }
];