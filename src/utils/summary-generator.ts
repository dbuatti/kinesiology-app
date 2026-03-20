"use client";

import { format } from "date-fns";
import { AppointmentWithClient } from "@/types/crm";

/**
 * Helper to format the priority pattern JSON into a readable string
 */
const formatPriorityPattern = (patternStr: string | null | undefined): string => {
  if (!patternStr || patternStr === "{}" || patternStr === "") return 'None recorded';
  
  try {
    const pattern = JSON.parse(patternStr);
    const lines: string[] = [];
    
    Object.entries(pattern).forEach(([category, items]: [string, any]) => {
      // Format category name (e.g., primitiveReflexes -> Primitive Reflexes)
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
      
      const entries = Object.entries(items)
        .map(([name, status]) => `${name} [${status}]`)
        .join(', ');
      
      if (entries) {
        lines.push(`  * ${categoryName}: ${entries}`);
      }
    });
    
    return lines.length > 0 ? '\n' + lines.join('\n') : 'None recorded';
  } catch (e) {
    return patternStr; // Fallback to raw if parsing fails
  }
};

/**
 * Generates a high-detail clinical summary of the entire appointment.
 */
export const generateSessionSummary = (appointment: AppointmentWithClient): string => {
  let summary = `FULL SESSION REPORT: ${appointment.clients.name}\n`;
  summary += `==========================================\n`;
  summary += `Session ID: ${appointment.display_id || appointment.id}\n`;
  summary += `Date: ${format(appointment.date, "EEEE, MMMM d, yyyy")}\n`;
  summary += `Status: ${appointment.status}\n`;
  summary += `Tag: ${appointment.tag}\n`;
  summary += `------------------------------------------\n`;
  summary += `GOAL: ${appointment.goal || 'Not set'}\n`;
  summary += `PRIMARY ISSUE: ${appointment.issue || 'Not set'}\n`;
  summary += `------------------------------------------\n\n`;

  summary += `[1] PRELIMINARY ASSESSMENTS\n`;
  summary += `- BOLT Score: ${appointment.bolt_score ? `${appointment.bolt_score}s` : 'Not recorded'}\n`;
  summary += `- Coherence: ${appointment.coherence_score ? appointment.coherence_score.toFixed(2) : 'Not recorded'}\n`;
  if (appointment.heart_rate) summary += `  (HR: ${appointment.heart_rate} bpm, BR: ${appointment.breath_rate} bpm)\n`;
  summary += `- Hydration: ${appointment.hydrated ? 'PASSED' : 'NEEDS ATTENTION'}\n`;
  if (appointment.hydration_notes) summary += `  Notes: ${appointment.hydration_notes}\n`;
  summary += `\n`;

  if (appointment.sagittal_plane_notes || appointment.frontal_plane_notes || appointment.transverse_plane_notes) {
    summary += `[2] RANGE OF MOTION (COGS)\n`;
    if (appointment.sagittal_plane_notes) summary += `- Sagittal: ${appointment.sagittal_plane_notes}\n`;
    if (appointment.frontal_plane_notes) summary += `- Frontal: ${appointment.frontal_plane_notes}\n`;
    if (appointment.transverse_plane_notes) summary += `- Transverse: ${appointment.transverse_plane_notes}\n`;
    summary += `\n`;
  }

  if (appointment.fakuda_notes || appointment.sharpened_rhombergs_notes || appointment.frontal_lobe_notes || appointment.righting_reflex_notes) {
    summary += `[3] NEUROLOGICAL GLOBAL\n`;
    if (appointment.fakuda_notes) summary += `- Fakuda Step Test: ${appointment.fakuda_notes}\n`;
    if (appointment.sharpened_rhombergs_notes) summary += `- Sharpened Rhombergs: ${appointment.sharpened_rhombergs_notes}\n`;
    if (appointment.frontal_lobe_notes) summary += `- Frontal Lobe Assessment: ${appointment.frontal_lobe_notes}\n`;
    if (appointment.righting_reflex_notes) summary += `- Righting Reflexes: ${appointment.righting_reflex_notes}\n`;
    summary += `\n`;
  }

  if (appointment.lymphatic_priority_zone || appointment.lymphatic_notes) {
    summary += `[4] LYMPHATIC SYSTEM\n`;
    if (appointment.lymphatic_suture_side) summary += `- Suture Side: ${appointment.lymphatic_suture_side}\n`;
    if (appointment.lymphatic_priority_zone) summary += `- Priority Zones: ${appointment.lymphatic_priority_zone}\n`;
    if (appointment.lymphatic_notes) summary += `- Lymphatic Notes: ${appointment.lymphatic_notes}\n`;
    summary += `\n`;
  }

  if (appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes) {
    summary += `[5] SNS DOWN-REGULATION\n`;
    if (appointment.harmonic_rocking_notes) summary += `- Harmonic Rocking: ${appointment.harmonic_rocking_notes}\n`;
    if (appointment.t1_reset_notes) summary += `- T1 Reset: ${appointment.t1_reset_notes}\n`;
    if (appointment.diaphragm_reset_notes) summary += `- Diaphragm Reset: ${appointment.diaphragm_reset_notes}\n`;
    if (appointment.vagus_nerve_notes) summary += `- Vagus Nerve Process: ${appointment.vagus_nerve_notes}\n`;
    summary += `\n`;
  }

  if (appointment.priority_pattern || appointment.modes_balances) {
    summary += `[6] PATHWAY & CORRECTIONS\n`;
    if (appointment.priority_pattern) {
      summary += `- Findings: ${formatPriorityPattern(appointment.priority_pattern)}\n`;
    }
    if (appointment.modes_balances) summary += `- Corrections Applied: ${appointment.modes_balances}\n`;
    summary += `\n`;
  }

  if (appointment.gait_notes) {
    summary += `[7] GAIT INTEGRATION\n`;
    summary += `${appointment.gait_notes}\n\n`;
  }

  if (appointment.emotion_primary_selection || appointment.emotion_notes || appointment.luscher_color_1) {
    summary += `[8] EMOTIONAL CONTEXT\n`;
    if (appointment.luscher_color_1) summary += `- Luscher Pair: ${appointment.luscher_color_1} + ${appointment.luscher_color_2}\n`;
    if (appointment.emotion_primary_selection) summary += `- Primary Emotion: ${appointment.emotion_primary_selection}\n`;
    if (appointment.emotion_secondary_selection) summary += `- Specifics: ${appointment.emotion_secondary_selection.join(', ')}\n`;
    if (appointment.emotion_notes) summary += `- Emotional Notes: ${appointment.emotion_notes}\n`;
    summary += `\n`;
  }

  summary += `[9] FINAL SUMMARY & HOMEWORK\n`;
  summary += `------------------------------------------\n`;
  summary += `ACUPOINTS: ${appointment.acupoints || 'None recorded'}\n\n`;
  summary += `RE-ASSESSMENT & HOMEWORK:\n${appointment.session_north_star || 'No specific homework recorded.'}\n\n`;
  summary += `GENERAL SESSION NOTES:\n${appointment.notes || 'No additional notes.'}\n`;
  
  if (appointment.journal) {
    summary += `\nPRACTITIONER REFLECTION:\n${appointment.journal}\n`;
  }

  return summary.trim();
};

/**
 * Formats a minimal text block for quick copying of appointment details.
 */
export const formatAppointmentQuickInfo = (appointment: any): string => {
  const id = appointment.display_id || appointment.id.slice(0, 8);
  const name = appointment.name || appointment.tag || "Session";
  const dateShort = format(new Date(appointment.date), "MMM d");
  const status = appointment.status;

  return `${id}\n${name}\n${dateShort}\n${status}`;
};

/**
 * Generates a deep clinical prompt for AI analysis.
 */
export const generateAICasePrompt = (client: any, appointments: any[]): string => {
  const latestApp = appointments[0];
  if (!latestApp) return "No session data available for analysis.";

  let prompt = `I am a Kinesiology practitioner analyzing a client case. Please provide clinical insights based on the following data:

CLIENT PROFILE:
- Name: ${client.name}
- History/Journal: ${client.journal || 'N/A'}

LATEST SESSION FINDINGS (${format(new Date(latestApp.date), "MMMM d, yyyy")}):
- Goal: ${latestApp.goal || 'N/A'}
- Primary Issue: ${latestApp.issue || 'N/A'}
- BOLT Score: ${latestApp.bolt_score ? `${latestApp.bolt_score}s` : 'N/A'}
- Coherence: ${latestApp.coherence_score ? latestApp.coherence_score.toFixed(2) : 'N/A'}
- Hydration: ${latestApp.hydrated ? 'Passed' : 'Failed'}

NEUROLOGICAL GLOBAL:
- Fakuda: ${latestApp.fakuda_notes || 'N/A'}
- Rhombergs: ${latestApp.sharpened_rhombergs_notes || 'N/A'}
- Frontal Lobe: ${latestApp.frontal_lobe_notes || 'N/A'}
- Righting Reflexes: ${latestApp.righting_reflex_notes || 'N/A'}

RANGE OF MOTION (COGS):
- Sagittal: ${latestApp.sagittal_plane_notes || 'N/A'}
- Frontal: ${latestApp.frontal_plane_notes || 'N/A'}
- Transverse: ${latestApp.transverse_plane_notes || 'N/A'}

PATHWAY & PATTERNS:
- Findings: ${latestApp.priority_pattern || 'N/A'}
- Corrections Applied: ${latestApp.modes_balances || 'N/A'}
- Acupoints: ${latestApp.acupoints || 'N/A'}

PRACTITIONER REFLECTION:
${latestApp.journal || latestApp.notes || 'N/A'}

Please analyze the relationship between the respiratory (BOLT), autonomic (Coherence), and neurological findings. Identify potential fractal patterns or priority systems for the next session.`;

  return prompt.trim();
};