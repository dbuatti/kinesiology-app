
export interface MechanoCase {
  id: string;
  symptom: string;
  history: string;
  diagnosticClue: string;
  correctPath: 'Unconscious';
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
    logicExplanation: "Whiplash often creates unconscious dural or ligamentous threat. GV16 facilitation confirms the Spinocerebellar pathway."
  },
  {
    id: 'case-6',
    symptom: "Deep pelvic pain when walking, specifically during the push-off phase.",
    history: "Slipped on ice last winter, landing hard on the hip.",
    diagnosticClue: "X-pattern facilitates. TL to GV16 (Cerebellum) stabilizes the pelvic girdle.",
    correctPath: 'Unconscious',
    localization: {
      skeleton: 'Axial',
      region: 'Lower',
      joint: 'Pelvis',
      plane: 'Transverse',
      actionOrTissue: 'Rotation'
    },
    logicExplanation: "Gait push-off requires pelvic rotation in the transverse plane. GV16 facilitation confirms an Unconscious (Spinocerebellar) mapping issue from the past fall."
  },
];