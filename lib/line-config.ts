// Centralized subway line configuration: colors, text contrast, and direction labels
export interface DirectionLabels { N: string; S: string }

// Default direction labels
export const DEFAULT_DIRECTION_LABELS: DirectionLabels = {
  N: 'Uptown',
  S: 'Downtown',
}

// Line-specific direction overrides (e.g. Manhattan/Brooklyn for L, Manhattan/Queens for 7)
export const LINE_DIRECTION_OVERRIDES: Record<string, DirectionLabels> = {
  L: { N: 'Manhattan', S: 'Brooklyn' },
  '7': { N: 'Manhattan', S: 'Queens' },
}

// Station-specific direction overrides (e.g. 42 St Shuttle)
export const STATION_DIRECTION_OVERRIDES: Record<string, DirectionLabels> = {
  // GTFS Stop ID for Times Sq-42 St Shuttle
  '902': { N: 'Times Sq',   S: 'Grand Central' },
  // GTFS Stop ID for Grand Central-42 St Shuttle
  '901': { N: 'Grand Central', S: 'Times Sq' },
}

// Compute direction labels based on station and lines
export function getDirectionLabels(lines: string[], stationId?: string): DirectionLabels {
  if (stationId && STATION_DIRECTION_OVERRIDES[stationId]) {
    return STATION_DIRECTION_OVERRIDES[stationId]
  }
  for (const line of lines) {
    if (LINE_DIRECTION_OVERRIDES[line]) {
      return LINE_DIRECTION_OVERRIDES[line]
    }
  }
  return DEFAULT_DIRECTION_LABELS
}

// Line color and text contrast configuration (hex colors and text color)
export interface LineConfig { color: string; textColor: 'black' | 'white' }
export const LINE_CONFIG: Record<string, LineConfig> = {
  A: { color: '#2850ad', textColor: 'white' },
  C: { color: '#2850ad', textColor: 'white' },
  E: { color: '#2850ad', textColor: 'white' },
  B: { color: '#ff6319', textColor: 'white' },
  D: { color: '#ff6319', textColor: 'white' },
  F: { color: '#ff6319', textColor: 'white' },
  M: { color: '#ff6319', textColor: 'white' },
  N: { color: '#fccc0a', textColor: 'black' },
  Q: { color: '#fccc0a', textColor: 'black' },
  R: { color: '#fccc0a', textColor: 'black' },
  W: { color: '#fccc0a', textColor: 'black' },
  '1': { color: '#ee352e', textColor: 'white' },
  '2': { color: '#ee352e', textColor: 'white' },
  '3': { color: '#ee352e', textColor: 'white' },
  '4': { color: '#00933c', textColor: 'white' },
  '5': { color: '#00933c', textColor: 'white' },
  '6': { color: '#00933c', textColor: 'white' },
  '7': { color: '#b933ad', textColor: 'white' },
  G: { color: '#00a550', textColor: 'white' },
  J: { color: '#996633', textColor: 'white' },
  Z: { color: '#996633', textColor: 'white' },
  L: { color: '#6c757d', textColor: 'white' },
  S: { color: '#6c757d', textColor: 'white' },
}

// Get the hex color for a given line (fallback to gray)
export function getLineColor(line: string): string {
  const key = line.charAt(0)
  return LINE_CONFIG[key]?.color ?? '#6c757d'
}

// Get the contrasting text color for a given line
export function getTextColor(line: string): 'black' | 'white' {
  const key = line.charAt(0)
  return LINE_CONFIG[key]?.textColor ?? 'white'
}