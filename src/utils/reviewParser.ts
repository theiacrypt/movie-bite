import { REVIEW_CATEGORIES } from '../services/tasteProfile.js';

export type ReviewTagSentiment = 'positive' | 'neutral' | 'negative';

export interface ParsedReviewTag {
  id: string;
  label: string;
  type: ReviewTagSentiment;
}

export interface ParsedReviewContent {
  cleanText: string;
  hasSpoiler: boolean;
  tags: ParsedReviewTag[];
}

const TAG_META_MAP: Record<string, ParsedReviewTag> = {};
for (const cat of Object.values(REVIEW_CATEGORIES)) {
  for (const opt of cat.options) {
    TAG_META_MAP[opt.id] = {
      id: opt.id,
      label: opt.label,
      type: opt.type as ReviewTagSentiment,
    };
  }
}

export function resolveReviewTag(tagId: string): ParsedReviewTag {
  const known = TAG_META_MAP[tagId];
  if (known) return known;
  return {
    id: tagId,
    label: tagId.replace(/_/g, ' '),
    type: 'neutral',
  };
}

/**
 * Parses serialized `[SPOILER]` prefixes and `\n[TAGS: ...]` blocks
 * from persisted `review_text` strings into clean display data.
 */
export function parseReviewContent(rawText?: string | null): ParsedReviewContent {
  if (!rawText) {
    return { cleanText: '', hasSpoiler: false, tags: [] };
  }

  let working = String(rawText);
  const hasSpoiler = /^\s*\[SPOILER\]/i.test(working) || /\[SPOILER\]/i.test(working);
  working = working.replace(/\[SPOILER\]/gi, '');

  const rawTagIds: string[] = [];
  working = working.replace(/\[TAGS:\s*([^\]]+)\]/gi, (_match, list: string) => {
    for (const part of list.split(',')) {
      const trimmed = part.trim();
      if (trimmed && !rawTagIds.includes(trimmed)) {
        rawTagIds.push(trimmed);
      }
    }
    return '';
  });

  const cleanText = working.trim();
  const tags = rawTagIds.map(resolveReviewTag);

  return { cleanText, hasSpoiler, tags };
}

/**
 * Formats SQLite UTC timestamps (`YYYY-MM-DD HH:MM:SS`) and ISO dates safely across browsers.
 */
export function formatReviewDate(
  dateStr?: string | null,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
): string {
  if (!dateStr) return '';
  try {
    const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)
      ? `${dateStr.replace(' ', 'T')}Z`
      : dateStr;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('de-DE', options);
  } catch {
    return '';
  }
}
