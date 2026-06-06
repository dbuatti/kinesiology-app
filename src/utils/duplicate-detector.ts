
/**
 * Calculates the Levenshtein distance between two strings.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Calculates the similarity ratio between two strings (0.0 to 1.0).
 */
export function getStringSimilarity(a: string, b: string): number {
  const distance = getLevenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1.0;
  return 1.0 - distance / maxLength;
}

/**
 * Calculates token-based similarity between two strings (0.0 to 1.0).
 * Useful for matching names with middle names, transposed names, or nicknames.
 */
export function getTokenSimilarity(a: string, b: string): number {
  const textA = normalizeName(a);
  const textB = normalizeName(b);
  
  const tokensA = textA.split(' ').filter(t => t.length > 1);
  const tokensB = textB.split(' ').filter(t => t.length > 1);
  
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  
  const intersection = tokensA.filter(t => tokensB.includes(t));
  const minLength = Math.min(tokensA.length, tokensB.length);
  
  return intersection.length / minLength;
}

/**
 * Normalizes a name string for comparison.
 */
export const normalizeName = (name: string) => (name || '').toLowerCase().trim().replace(/\s+/g, ' ');

/**
 * Normalizes an email address, handling Gmail specific aliases and temporary duplicate suffixes.
 */
export const normalizeEmail = (email: string) => {
  let clean = (email || '').toLowerCase().trim();
  
  // Strip any temporary duplicate suffix first
  if (clean.includes('+dup-')) {
    const parts = clean.split('@');
    const localWithoutDup = parts[0].split('+dup-')[0];
    clean = parts.length === 2 ? `${localWithoutDup}@${parts[1]}` : localWithoutDup;
  }

  if (clean.endsWith('@gmail.com')) {
    const parts = clean.split('@');
    const local = parts[0].split('+')[0].replace(/\./g, '');
    return `${local}@gmail.com`;
  }
  return clean;
};

/**
 * Normalizes a phone number to its last 9 digits.
 */
export const normalizePhone = (phone: string) => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
};