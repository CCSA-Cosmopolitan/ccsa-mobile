/**
 * Text utility functions for ccsa-mobile
 */

/**
 * Format polling unit string: remove hyphens/underscores, convert to sentence case
 * e.g. "hida-primary-school" -> "Hida primary school"
 */
export function formatPollingUnit(text?: string | null): string {
  if (!text) return 'N/A';
  const cleaned = text.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'N/A';

  // Sentence case: Capitalize first character, lowercase the rest
  let result = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();

  // Uppercase Roman numerals at word boundaries (e.g. I, II, III, IV, V)
  result = result.replace(/\b(i{1,3}|iv|v|vi{1,3}|ix|x)\b/gi, (m) => m.toUpperCase());

  return result;
}
