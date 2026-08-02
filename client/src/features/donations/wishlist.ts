import { apiData } from '@/lib/apiClient'
import { wishlistItems, type WishlistItem } from '@/features/donations/fixtures'

/**
 * The wishlist API.
 *
 * `GET /api/wishlist` and `GET /api/wishlist/:id` deliberately do **not** use the CONTEXT.md
 * §29 `{ data }` envelope every other endpoint returns — the list answers `{ items, meta }`
 * and the detail answers a bare item. `apiData` falls back to wrapping an unenveloped body,
 * so both land under `res.data`, but the shapes differ and the unwrapping below is where that
 * inconsistency is absorbed rather than leaking into components.
 *
 * Left as-is on purpose: changing a live response shape is a breaking change for anything
 * else already consuming it, and that is not a call to make from this branch.
 */

type WishlistApiItem = {
  id: string
  title: Record<string, string>
  why: Record<string, string>
  needed: number
  pledged: number
  image: string | null
}

/**
 * `accent` colours the progress bar and is **not** a server field — it is presentation, and
 * the API has no opinion about it. Keyed off the seeded ids so the palette survives the switch
 * from fixtures; anything unrecognised falls back rather than rendering a bar with
 * `background-color: undefined`, which silently paints nothing.
 */
const FALLBACK_ACCENT = '#E4002B'
const ACCENTS: Record<string, string> = Object.fromEntries(
  wishlistItems.map((item) => [item.id, item.accent]),
)

function toItem(row: WishlistApiItem): WishlistItem {
  return {
    id: row.id,
    title: row.title as WishlistItem['title'],
    why: row.why as WishlistItem['why'],
    needed: row.needed,
    pledged: row.pledged,
    image: row.image ?? '',
    accent: ACCENTS[row.id] ?? FALLBACK_ACCENT,
  }
}

export async function fetchWishlist(): Promise<WishlistItem[]> {
  const res = await apiData<{ items: WishlistApiItem[] }>('/api/wishlist')
  return (res.data?.items ?? []).map(toItem)
}

export async function fetchWishlistItem(id: string): Promise<WishlistItem> {
  const res = await apiData<WishlistApiItem>(`/api/wishlist/${encodeURIComponent(id)}`)
  return toItem(res.data)
}
