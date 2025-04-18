// Centralized subway line metadata (color, icon text color, etc.)
// This replaces scattered switch‑statements across components.

// Raw design guidelines (MTA):
//  – Blue    #0039A6  A C E
//  – Orange #FF6319  B D F M
//  – Yellow #FCCC0A  N Q R W  (black text for contrast)
//  – Red    #EE352E  1 2 3
//  – Green  #00933C  4 5 6 G
//  – Purple #B933AD  7
//  – Brown  #996633  J Z
//  – Gray   #808183  L S (Shuttles) and unknown lines

export type LineId = string

interface LineMeta {
  /** Hex background colour **/
  color: string
  /** Whether black (true) or white (false) text should be used on top of this colour */
  useBlackText: boolean
}

const DEFAULT_META: LineMeta = {
  color: '#808183', // grey
  useBlackText: false,
}

// Build a lookup: first character (letter/number) → LineMeta
const LINE_META_MAP: Record<string, LineMeta> = {
  // Blue
  A: { color: '#0039A6', useBlackText: false },
  C: { color: '#0039A6', useBlackText: false },
  E: { color: '#0039A6', useBlackText: false },

  // Orange
  B: { color: '#FF6319', useBlackText: false },
  D: { color: '#FF6319', useBlackText: false },
  F: { color: '#FF6319', useBlackText: false },
  M: { color: '#FF6319', useBlackText: false },

  // Yellow – needs dark text
  N: { color: '#FCCC0A', useBlackText: true },
  Q: { color: '#FCCC0A', useBlackText: true },
  R: { color: '#FCCC0A', useBlackText: true },
  W: { color: '#FCCC0A', useBlackText: true },

  // Red
  '1': { color: '#EE352E', useBlackText: false },
  '2': { color: '#EE352E', useBlackText: false },
  '3': { color: '#EE352E', useBlackText: false },

  // Green
  '4': { color: '#00933C', useBlackText: false },
  '5': { color: '#00933C', useBlackText: false },
  '6': { color: '#00933C', useBlackText: false },
  G: { color: '#00933C', useBlackText: false },

  // Purple
  '7': { color: '#B933AD', useBlackText: false },

  // Brown
  J: { color: '#996633', useBlackText: false },
  Z: { color: '#996633', useBlackText: false },

  // Gray / Shuttle / L
  L: { color: '#808183', useBlackText: false },
  S: { color: '#808183', useBlackText: false },
}

/**
 * Return the hex colour for a subway route.
 * Accepts GTFS route id (can be long like "101" – we use its first character).
 */
export function getLineColor(line: LineId): string {
  if (!line) return DEFAULT_META.color
  const key = line.charAt(0).toUpperCase()
  return (LINE_META_MAP[key] ?? DEFAULT_META).color
}

/** Whether black text should be rendered on the icon for this route */
export function shouldUseBlackText(line: LineId): boolean {
  if (!line) return DEFAULT_META.useBlackText
  const key = line.charAt(0).toUpperCase()
  return (LINE_META_MAP[key] ?? DEFAULT_META).useBlackText
}

export function getLineMeta(line: LineId): LineMeta {
  if (!line) return DEFAULT_META
  const key = line.charAt(0).toUpperCase()
  return LINE_META_MAP[key] ?? DEFAULT_META
}
