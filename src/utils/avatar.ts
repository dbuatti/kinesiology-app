const AVATAR_COLORS = [
  "bg-chart-primary", "bg-pink-600", "bg-chart-emerald", "bg-amber-600", "bg-purple-600",
  "bg-cyan-600", "bg-rose-700", "bg-lime-600", "bg-teal-600", "bg-fuchsia-600",
  "bg-primary", "bg-yellow-600", "bg-green-600", "bg-violet-600", "bg-orange-600",
];

export function nameHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

export function nameInitials(name: string): string {
  const cleaned = name.replace(/[^\p{L}\s]/gu, "").trim();
  return cleaned.split(/\s+/).filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

export function avatarColor(name: string): string {
  return AVATAR_COLORS[nameHash(name) % AVATAR_COLORS.length];
}