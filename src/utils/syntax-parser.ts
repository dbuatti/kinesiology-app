"use client";

export interface ParsedFinding {
  priority: string;
  target: string;
  direction: string;
  corrections: string[];
  metadata: string;
  raw: string;
}

/**
 * Parses Sven's Clinical Syntax:
 * Format: : [Priority] - [Target] || [Direction], [Correction1], [Correction2] >> [Metadata]
 * Example: : 1 - Babinski.L || E, Pons, Medulla.R >> Major surprise at the instant change.
 */
export function parseClinicalSyntax(text: string): ParsedFinding[] {
  if (!text) return [];

  const lines = text.split('\n').filter(line => line.trim().startsWith(':'));
  
  return lines.map(line => {
    const raw = line.trim();
    // Remove the leading colon
    const content = raw.substring(1).trim();
    
    // Split by metadata separator >>
    const [mainPart, metadata = ""] = content.split('>>').map(s => s.trim());
    
    // Split by direction separator ||
    const [targetPart, correctionPart = ""] = mainPart.split('||').map(s => s.trim());
    
    // Parse Priority and Target from "1 - Babinski.L"
    const dashIndex = targetPart.indexOf('-');
    const priority = dashIndex !== -1 ? targetPart.substring(0, dashIndex).trim() : "?";
    const target = dashIndex !== -1 ? targetPart.substring(dashIndex + 1).trim() : targetPart;
    
    // Parse Direction and Corrections from "E, Pons, Medulla.R"
    const correctionItems = correctionPart.split(',').map(s => s.trim());
    const direction = correctionItems[0] || "";
    const corrections = correctionItems.slice(1);

    return {
      priority,
      target,
      direction,
      corrections,
      metadata,
      raw
    };
  });
}

export function getDirectionColor(direction: string): string {
  const d = direction.toUpperCase();
  if (d === 'E') return 'text-purple-600';
  if (d === 'A') return 'text-blue-600';
  if (d === 'EASE') return 'text-emerald-600';
  return 'text-slate-600';
}

export function getDirectionLabel(direction: string): string {
  const d = direction.toUpperCase();
  if (d === 'E') return 'Efferent';
  if (d === 'A') return 'Afferent';
  if (d === 'EASE') return 'SNS Reset';
  return direction;
}