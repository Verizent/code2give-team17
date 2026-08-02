import { useEffect, useState, type FormEvent } from 'react'
import { useSite } from '@/components/site-provider'
import { listWishlist, type WishlistItem } from '@/features/donations/api'
import { fetchWishlist } from '@/features/donations/wishlist'
import { addPledge, getExtraPledged } from '@/features/donations/wishlist-store'
import { isRealApiMode } from '@/lib/apiClient'
import { trackEvent } from '@/lib/analytics'

export function WishlistGrid() {
  const { locale, t } = useSite()
  const g = t.give
  const [, setTick] = useState(0)

  // Bundled fixtures were the only source until now, and they had already drifted: the seeded
  // trampoline socks read 12 pledged where the database said 32. A hardcoded copy of mutable
  // data is wrong the moment anybody pledges.
  const [baseItems, setBaseItems] = useState<WishlistItem[]>(
    isRealApiMode() ? [] : listWishlist(),
  )
  const [loading, setLoading] = useState(isRealApiMode())
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (!isRealApiMode()) return
    let cancelled = false
    void (async () => {
      try {
        const fetched = await fetchWishlist()
        if (!cancelled) setBaseItems(fetched)
      } catch {
        // Kept distinct from "no items": rendering the empty state would tell a supporter
        // nothing is needed, when the truth is we could not reach the server.
        if (!cancelled) setLoadFailed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const items = baseItems.map((item) => ({
    ...item,
    pledged: item.pledged + getExtraPledged(item.id),
  }))
  const [selected, setSelected] = useState<WishlistItem | null>(null)
  const [sent, setSent] = useState(false)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (!selected) return
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setSelected(null)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [selected])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!selected) return
    addPledge(selected.id, qty)
    trackEvent('wishlist_pledge', { id: selected.id, qty })
    setTick((n) => n + 1)
    setSent(true)
  }

  return (
    <section aria-labelledby="wishlist-title">
      <h2 id="wishlist-title" className="font-display text-3xl font-semibold text-navy">
        {g.wishlistTitle}
      </h2>
      <p className="mt-3 max-w-2xl text-navy/70">{g.wishlistSubhead}</p>
      {loading ? (
        <p className="mt-8 rounded-2xl bg-white p-6 text-navy/60">{g.wishlistLoading}</p>
      ) : loadFailed ? (
        <p role="alert" className="mt-8 rounded-2xl bg-white p-6 text-navy/70">
          {g.wishlistLoadFailed}
        </p>
      ) : items.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {items.map((item) => {
            const percent = Math.min(100, Math.round((item.pledged / item.needed) * 100))
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <img src={item.image} alt="" className="aspect-[16/9] w-full object-cover" />
                <div className="p-5">
                  <h3 className="font-display text-xl font-semibold text-navy">
                    {item.title[locale]}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy/70">{item.why[locale]}</p>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-navy/10">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percent}%`, backgroundColor: item.accent }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs font-semibold text-navy/65">
                    <span>{g.pledged.replace('{n}', String(item.pledged))}</span>
                    <span>{g.needed.replace('{n}', String(item.needed))}</span>
                  </div>
                  <button
                    type="button"
                    disabled={item.pledged >= item.needed}
                    onClick={() => {
                      setSent(false)
                      setQty(1)
                      setSelected(item)
                    }}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-navy px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {g.pledgeCta}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="mt-8 rounded-2xl bg-white p-6 text-navy/70">{g.wishlistEmpty}</p>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pledge-title"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="pledge-title" className="font-display text-2xl font-semibold text-navy">
              {g.pledgeTitle}: {selected.title[locale]}
            </h2>
            {sent ? (
              <>
                <p className="mt-5 rounded-xl bg-teal/10 p-4 text-teal">{g.pledgeSuccess}</p>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="mt-6 min-h-12 w-full rounded-md border border-navy font-semibold text-navy"
                >
                  {g.pledgeClose}
                </button>
              </>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                <label className="block text-sm font-semibold text-navy">
                  {g.emailLabel}
                  <input
                    required
                    type="email"
                    className="mt-2 min-h-12 w-full rounded-md border border-navy/20 px-4"
                  />
                </label>
                <label className="block text-sm font-semibold text-navy">
                  {g.pledgeQty}
                  <input
                    required
                    type="number"
                    min={1}
                    max={Math.max(1, selected.needed - selected.pledged)}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value) || 1)}
                    className="mt-2 min-h-12 w-full rounded-md border border-navy/20 px-4"
                  />
                </label>
                <label className="block text-sm font-semibold text-navy">
                  {g.pledgeNote}
                  <input className="mt-2 min-h-12 w-full rounded-md border border-navy/20 px-4" />
                </label>
                <button
                  type="submit"
                  className="min-h-12 w-full rounded-md bg-red px-5 font-semibold text-white"
                >
                  {g.pledgeSubmit}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
