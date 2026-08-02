const KEY = 'love21-wishlist-pledges'

type Pledges = Record<string, number>

function read(): Pledges {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Pledges
  } catch {
    return {}
  }
}

function write(p: Pledges) {
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function getExtraPledged(itemId: string): number {
  return read()[itemId] ?? 0
}

export function addPledge(itemId: string, qty: number) {
  const p = read()
  p[itemId] = (p[itemId] ?? 0) + Math.max(1, Math.round(qty))
  write(p)
}

/** Total item units pledged in this browser (wishlist gifts). */
export function totalItemPledges(): number {
  return Object.values(read()).reduce((sum, n) => sum + (Number(n) || 0), 0)
}

/** Distinct wishlist lines this browser has pledged to. */
export function pledgedItemLines(): number {
  return Object.values(read()).filter((n) => Number(n) > 0).length
}
