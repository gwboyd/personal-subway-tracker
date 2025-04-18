// Helper utilities for managing temporary (pinned) stations that live only in
// the browser. These IDs are **not** synced to Supabase and are cleared on
// logout.

const STORAGE_KEY = 'subway_temp_stations'

export function getTempStationsFromLocalStorage(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as string[] : []
  } catch {
    return []
  }
}

export function saveTempStationsToLocalStorage(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    /* noop */
  }
}


export function clearTempStationsFromLocalStorage() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
