/**
 * Overrides for the default “Uptown / Downtown” direction labels.
 * If the currently selected station serves one of these lines, we
 * substitute the generic labels with more meaningful geography.
 *
 * Key   – route id (first character is fine, e.g. "L", "7", "S")
 * Value – object mapping compass direction → display string.
 */

export interface DirectionLabels {
  N: string
  S: string
}

const DEFAULT_LABELS: DirectionLabels = {
  N: 'Uptown',
  S: 'Downtown',
}

const DIRECTION_OVERRIDES: Record<string, DirectionLabels> = {
  // L train crosses East River
  L: { N: 'Manhattan', S: 'Brooklyn' },

  // 7 train between Manhattan and Queens
  '7': { N: 'Manhattan', S: 'Queens' },

  // Times Sq – Grand Central shuttle (route id "S")
  S: { N: 'Times Sq', S: 'Grand Central' },
}

/**
 * Return labels for the provided set of lines.
 * First match in the array wins (so you can prioritise custom order if needed).
 */
export function getDirectionLabelsForLines(lines: string[] | undefined | null): DirectionLabels {
  if (!lines || lines.length === 0) return DEFAULT_LABELS

  for (const line of lines) {
    const key = line.charAt(0).toUpperCase()
    if (DIRECTION_OVERRIDES[key]) {
      return DIRECTION_OVERRIDES[key]
    }
  }
  return DEFAULT_LABELS
}
