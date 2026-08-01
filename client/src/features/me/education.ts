/**
 * Client-side learn engagement for Impact Garden (pillar: learn).
 * Records distinct article / story ids the supporter actually opened on this device.
 * Server-attributed per-profile views (§23) can replace this later.
 */

const KEY = 'love21-learn-reads'

/** @returns distinct article / story ids marked as read */
export function listEducationReads(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export function educationReadCount(): number {
  return listEducationReads().length
}

/** Record that the supporter opened a News / Learn story. */
export function markEducationRead(id: string) {
  if (!id) return
  const next = new Set(listEducationReads())
  next.add(id)
  localStorage.setItem(KEY, JSON.stringify([...next]))
}
