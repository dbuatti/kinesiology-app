"use client";

export interface MechanoFlashcard {
  id: string;
  question: string;
  answer: string;
  category: 'Theory' | 'Conscious' | 'Unconscious' | 'Clinical';
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