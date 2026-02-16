/**
 * Cleans 5etools {@tag text|ref} markup from strings.
 * Iterates until no tags remain (handles nested tags).
 */
export function cleanMarkup(text: string): string {
  let result = text;
  let prev: string;
  do {
    prev = result;
    // {@tag text|ref} and {@tag text}
    result = result.replace(/{@\w+\s+([^|}]+)(?:\|[^}]*)?}/g, '$1');
    // {@tagtext|...} and {@tagtext}
    result = result.replace(/{@\w+([^|}\s]+)(?:\||})[^}]*}/g, '$1');
  } while (result !== prev);
  return result;
}

/**
 * Recursively cleans markup in any value: strings, arrays, or objects.
 */
export function cleanMarkupDeep(value: unknown): unknown {
  if (typeof value === 'string') return cleanMarkup(value);
  if (Array.isArray(value)) return value.map(cleanMarkupDeep);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = cleanMarkupDeep(v);
    }
    return out;
  }
  return value;
}
