"use client";

export interface MechanoCase {
  id: string;
  symptom: string;
  history: string;
  diagnosticClue: string;
  correctPath: 'Conscious' | 'Unconscious';
  localization: {
    skeleton: 'Axial' | 'Appendicular';
    region: 'Upper' | 'Lower';
    joint: string;
    plane: 'Sagittal' | 'Frontal' | 'Transverse';
    actionOrTissue: string;
  };
  logicExplanation: string;
}

export const MECHANO_CASES: MechanoCase[] = [
  {
    id: 'case-1',
    symptom: "Sharp pain in the right shoulder when reaching for a seatbelt.",
    history: "No specific injury, but has been worsening over 3 months.",
    diagnosticClue: "X-pattern facilitates the IM. TL to the Left Sensory Cortex (S1) also facilitates.",
    correctPath: 'Conscious',
    localization: {
      skeleton: 'Appendicular',
      region: 'Upper',
      joint: 'Shoulder (GH Joint)',
      plane: 'Transverse',
      actionOrTissue: 'Internal Rotation'
    },
    logicExplanation: "Since TL to the contralateral S1 facilitated, this is a Conscious (DCML) priority. Reaching for a seatbelt involves internal rotation in the transverse plane."
  },
  {
    id: 'case-2',
    symptom: "Chronic 'giving way' feeling in the left ankle.",
    history: "Severe inversion sprain 2 years ago while hiking.",
    diagnosticClue: "X-pattern facilitates. TL to GV16 (Cerebellum) facilitates.",
    correctPath: 'Unconscious',
    localization: {
      skeleton: 'Appendicular',
      region: 'Lower',
      joint: 'Foot/Ankle',
      plane: 'Frontal',
      actionOrTissue: 'ATFL Ligament (Stretch)'
    },
    logicExplanation: "TL to GV16 indicates an Unconscious (Spinocerebellar) priority. The history of a sprain points to a ligamentous threat (ATFL) requiring a stretch correction."
  },
  {
    id: 'case-3',
    symptom: "Dull ache in the low back when standing up from a chair.",
    history: "Sedentary office worker, feels 'stiff' constantly.",
    diagnosticClue: "X-pattern facilitates. Isometric extension of the lumbar spine clears the inhibition.",
    correctPath: 'Conscious',
    localization: {
      skeleton: 'Axial',
      region: 'Lower',
      joint: 'Lumbar Spine',
      plane: 'Sagittal',
      actionOrTissue: 'Extension'
    },
    logicExplanation: "Standing up requires lumbar extension in the sagittal plane. The facilitation via isometric hold confirms a Conscious DCML pathway issue."
  },
  {
    id: 'case-4',
    symptom: "Neck tension and headaches that worsen with eye movement.",
    history: "Recent minor fender bender (whiplash).",
    diagnosticClue: "X-pattern facilitates. Holding the base of the skull (GV16) while gently stretching the posterior neck clears the IM.",
    correctPath: 'Unconscious',
    localization: {
      skeleton: 'Axial',
      region: 'Upper',
      joint: 'Cervical Spine',
      plane: 'Sagittal',
      actionOrTissue: 'Posterior Ligaments (Stretch)'
    },
    logicExplanation: "Whiplash often creates unconscious ligamentous threat. GV16 facilitation confirms the Spinocerebellar pathway."
  }
];