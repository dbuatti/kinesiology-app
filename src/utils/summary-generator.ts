"use client";

import { format } from "date-fns";
import { AppointmentWithClient } from "@/types/crm";

/**
 * Generates a comprehensive clinical summary for the practitioner or client.
 */
export const generateSessionSummary = (appointment: AppointmentWithClient): string => {
  let summary = `SESSION SUMMARY: ${appointment.clients.name}\n`;
  summary += `Date: ${format(appointment.date, "MMMM d, yyyy")}\n`;
  summary += `Goal: ${appointment.goal || 'Not set'}\n`;
  summary += `Issue: ${appointment.issue || 'Not set'}\n\n`;

  summary += `KEY ASSESSMENTS:\n`;
  summary += `- BOLT Score: ${appointment.bolt_score ? `${appointment.bolt_score}s` : 'Not recorded'}\n`;
  summary += `- Coherence: ${appointment.coherence_score ? appointment.coherence_score.toFixed(2) : 'Not recorded'}\n`;
  summary += `- Hydration: ${appointment.hydrated ? 'Passed' : 'Needs attention'}\n`;

  if (appointment.sagittal_plane_notes || appointment.frontal_plane_notes || appointment.transverse_plane_notes) {
    summary += `\nRANGE OF MOTION (COGS):\n`;
    if (appointment.sagittal_plane_notes) summary += `- Sagittal: ${appointment.sagittal_plane_notes}\n`;
    if (appointment.frontal_plane_notes) summary += `- Frontal: ${appointment.frontal_plane_notes}\n`;
    if (appointment.transverse_plane_notes) summary += `- Transverse: ${appointment.transverse_plane_notes}\n`;
  }

  if (appointment.fakuda_notes || appointment.sharpened_rhombergs_notes || appointment.frontal_lobe_notes || appointment.righting_reflex_notes) {
    summary += `\nNEUROLOGICAL FINDINGS:\n`;
    if (appointment.fakuda_notes) summary += `- Fakuda: ${appointment.fakuda_notes}\n`;
    if (appointment.sharpened_rhombergs_notes) summary += `- Rhombergs: ${appointment.sharpened_rhombergs_notes}\n`;
    if (appointment.frontal_lobe_notes) summary += `- Frontal Lobe: ${appointment.frontal_lobe_notes}\n`;
    if (appointment.righting_reflex_notes) summary += `- Righting Reflexes: ${appointment.righting_reflex_notes}\n`;
  }

  if (appointment.emotion_secondary_selection && appointment.emotion_secondary_selection.length > 0) {
    summary += `\nEMOTIONAL CONTEXT: ${appointment.emotion_secondary_selection.join(', ')}\n`;
  }

  if (appointment.notes || appointment.priority_pattern || appointment.modes_balances) {
    summary += `\nSESSION NOTES & FINDINGS:\n`;
    if (appointment.priority_pattern) summary += `- Pathway: ${appointment.priority_pattern}\n`;
    if (appointment.modes_balances) summary += `- Corrections: ${appointment.modes_balances}\n`;
    if (appointment.notes) summary += `- General: ${appointment.notes}\n`;
  }
  
  if (appointment.session_north_star) {
    summary += `\nRE-ASSESSMENT & HOMEWORK:\n${appointment.session_north_star}\n`;
  }

  if (appointment.acupoints) {
    summary += `\nACUPOINTS USED: ${appointment.acupoints}\n`;
  }

  return summary.trim();
};

/**
 * Formats a minimal text block for quick copying of appointment details.
 */
export const formatAppointmentQuickInfo = (appointment: any): string => {
  const id = appointment.display_id || appointment.id.slice(0, 8);
  const name = appointment.name || appointment.tag || "Session";
  const dateLong = format(new Date(appointment.date), "MMM d, yyyy");
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