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
