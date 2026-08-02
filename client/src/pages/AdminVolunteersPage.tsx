import { useEffect, useMemo, useState } from 'react'
import { fetchAdminOpportunities, type AdminOpportunity } from '@/features/admin/api'
import { SessionRoster } from '@/features/admin/components/session-roster'
import { OpportunityForm } from '@/features/admin/components/opportunity-form'
import { PROGRAMME_LABELS, label } from '@/features/admin/components/labels'
import { useSite } from '@/components/site-provider'
import { cn } from '@/lib/utils'

/**
 * Who volunteered, by session — and the form that creates a new session to volunteer for.
 *
 * Sessions are listed rather than signups because the question staff actually ask is "who is
 * coming on Saturday", not "find this person". Rosters load when a row is opened, so the
 * page costs one request rather than one per session.
 */
export function AdminVolunteersPage() {
  const { t } = useSite()
  const a = t.admin
  const [rows, setRows] = useState<AdminOpportunity[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(false)
  const [openIds, setOpenIds] = useState<string[]>([])
  const [showPast, setShowPast] = useState(false)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function load() {
    try {
      const { items, total: count } = await fetchAdminOpportunities()
      setRows(items)
      setTotal(count)
      setError(false)
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  // Split on start time rather than on `status`: a session can sit at 'open' long after it
  // has happened, and the admin asking about last week does not care what the flag says.
  const { upcoming, past } = useMemo(() => split(rows ?? []), [rows])

  function toggle(id: string) {
    setOpenIds((current) =>
      current.includes(id) ? current.filter((open) => open !== id) : [...current, id],
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
            {a.volunteersTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-navy/70">{a.volunteersIntro}</p>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => {
              setCreating(true)
              setNotice(null)
            }}
            className="min-h-11 rounded-md bg-navy px-5 text-sm font-semibold text-white"
          >
            {a.volunteersNewButton}
          </button>
        )}
      </div>

      {notice && (
        <p className="mt-4 rounded-md bg-teal/10 px-3 py-2 text-sm text-navy">{notice}</p>
      )}

      {creating && (
        <OpportunityForm
          onCancel={() => setCreating(false)}
          onCreated={(opportunity) => {
            setCreating(false)
            setNotice(a.volunteersCreated.replace('{title}', opportunity.title_en))
            void load()
          }}
        />
      )}

      {error && (
        <p role="alert" className="mt-6 rounded-md bg-red/10 px-3 py-2 text-sm text-red">
          {a.volunteersLoadError}
        </p>
      )}

      {rows !== null && rows.length === 0 && !error && (
        <p className="mt-8 text-navy/70">{a.volunteersEmpty}</p>
      )}

      {upcoming.length > 0 && (
        <ul className="mt-8 space-y-3">
          {upcoming.map((row) => (
            <SessionRow
              key={row.id}
              row={row}
              open={openIds.includes(row.id)}
              onToggle={() => toggle(row.id)}
            />
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowPast((value) => !value)}
            className="mt-8 min-h-11 text-sm font-semibold text-teal"
            aria-expanded={showPast}
          >
            {showPast ? a.volunteersHidePast : a.volunteersShowPast}
          </button>
          {showPast && (
            <>
              <h2 className="mt-4 kicker text-navy/55">{a.volunteersPastHeading}</h2>
              <ul className="mt-3 space-y-3">
                {past.map((row) => (
                  <SessionRow
                    key={row.id}
                    row={row}
                    open={openIds.includes(row.id)}
                    onToggle={() => toggle(row.id)}
                  />
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* The server caps a page at 50. Saying so beats a list that looks complete. */}
      {rows !== null && total > rows.length && (
        <p className="mt-6 text-sm text-navy/55">{a.volunteersTruncated}</p>
      )}
    </div>
  )
}

function SessionRow({
  row,
  open,
  onToggle,
}: {
  row: AdminOpportunity
  open: boolean
  onToggle: () => void
}) {
  const { t } = useSite()
  const a = t.admin

  return (
    <li className="rounded-lg border border-navy/15 bg-white/60">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block font-semibold text-navy">{row.title_en}</span>
          <span className="block text-xs text-navy/55">{row.title_zh}</span>
          <span className="mt-1 block text-sm text-navy/65">
            {formatWhen(row.starts_at)} · {row.location_en}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-sm font-semibold text-navy/75">
            {a.volunteersCount
              .replace('{count}', String(row.signup_count))
              .replace('{capacity}', String(row.capacity))}
          </span>
          <span className="rounded-full bg-navy/5 px-2 py-0.5 text-xs text-navy/65">
            {label(PROGRAMME_LABELS, row.programme)}
          </span>
          <span className="rounded-full bg-navy/5 px-2 py-0.5 text-xs text-navy/65">
            {row.status}
          </span>
          <span aria-hidden className={cn('text-navy/45', open && 'rotate-90')}>
            ›
          </span>
        </span>
      </button>
      {open && (
        <div className="border-t border-navy/10">
          <SessionRoster opportunityId={row.id} />
        </div>
      )}
    </li>
  )
}

function split(rows: AdminOpportunity[]) {
  const now = Date.now()
  const upcoming: AdminOpportunity[] = []
  const past: AdminOpportunity[] = []

  for (const row of rows) {
    const starts = new Date(row.starts_at).getTime()
    if (Number.isNaN(starts) || starts >= now) upcoming.push(row)
    else past.push(row)
  }

  upcoming.sort((one, two) => one.starts_at.localeCompare(two.starts_at))
  past.sort((one, two) => two.starts_at.localeCompare(one.starts_at))
  return { upcoming, past }
}

function formatWhen(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-HK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
