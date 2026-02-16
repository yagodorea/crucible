import { cleanMarkup } from './markup-cleaner.js';

/**
 * Recursively walks a 5etools entry tree and extracts plain text.
 * Handles: string, entries, section, quote, inline, row, entry objects.
 */
export function extractEntries(entries: unknown[]): string {
  const parts: string[] = [];

  for (const entry of entries) {
    if (typeof entry === 'string') {
      parts.push(cleanMarkup(entry));
    } else if (entry && typeof entry === 'object') {
      const obj = entry as Record<string, unknown>;

      if (Array.isArray(obj.entries)) {
        parts.push(extractEntries(obj.entries));
      } else if (typeof obj.entry === 'string') {
        parts.push(cleanMarkup(obj.entry));
      } else if (Array.isArray(obj.entry)) {
        parts.push(extractEntries(obj.entry));
      }

      // Handle table rows
      if (obj.type === 'row' && Array.isArray(obj.row)) {
        for (const cell of obj.row) {
          if (typeof cell === 'string') {
            parts.push(cleanMarkup(cell));
          } else if (cell && typeof cell === 'object') {
            const cellObj = cell as Record<string, unknown>;
            if (typeof cellObj.entry === 'string') {
              parts.push(cleanMarkup(cellObj.entry));
            } else if (Array.isArray(cellObj.entry)) {
              parts.push(extractEntries(cellObj.entry));
            }
          }
        }
      }
    }
  }

  return parts.filter(Boolean).join('\n\n');
}

/**
 * Extracts a feat description: top-level strings + named sub-entries.
 */
export function extractFeatDescription(entries: unknown[]): string {
  const parts: string[] = [];

  for (const entry of entries) {
    if (typeof entry === 'string') {
      parts.push(cleanMarkup(entry));
    } else if (entry && typeof entry === 'object') {
      const obj = entry as Record<string, unknown>;
      if (obj.type === 'entries' && obj.name && Array.isArray(obj.entries)) {
        const sub = (obj.entries as unknown[])
          .filter((e): e is string => typeof e === 'string')
          .map(cleanMarkup);
        if (sub.length > 0) {
          parts.push(`${obj.name}: ${sub.join(' ')}`);
        }
      } else if (typeof obj.entry === 'string') {
        parts.push(cleanMarkup(obj.entry));
      }
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
