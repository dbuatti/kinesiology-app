"use client";

import { format } from "date-fns";
import { AppointmentWithClient } from "@/types/crm";

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