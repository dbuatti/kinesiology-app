"use client";

import { FINDING_TO_NUCLEI, Nuclei } from "@/utils/brainstem-logic";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import { isMeridianPeakNow } from "@/utils/crm-utils";

/**
 * The Clinical Registry is the single source of truth for all neurological 
 * and physiological associations in the Resonance ecosystem.
 */

export const ClinicalRegistry = {
  /**
   * Maps any finding (Muscle, Nerve, Reflex) to its brainstem nuclei.
   */
  getNucleiForFinding: (name: string): Nuclei | 'Cortex' | 'Unknown' => {
    const mappingKey = Object.keys(FINDING_TO_NUCLEI).find(key => name.startsWith(key));
    return mappingKey ? FINDING_TO_NUCLEI[mappingKey].nuclei : 'Unknown';
  },

  /**
   * Gets the full clinical context for a muscle, including its meridian and tone.
   */
  getMuscleContext: (name: string) => {
    const info = getMuscleInfo(name);
    const nuclei = ClinicalRegistry.getNucleiForFinding(name);
    const channel = TCM_CHANNELS.find(c => c.name === info.meridian);
    
    return {
      ...info,
      nuclei,
      channel
    };
  },

  /**
   * Determines if a specific meridian is currently at its peak activity.
   */
  isMeridianPeak: (peakTimeStr: string | undefined): boolean => {
    if (!peakTimeStr || peakTimeStr === 'None') return false;
    const currentHour = new Date().getHours();
    return isMeridianPeakNow(peakTimeStr, currentHour);
  }
};