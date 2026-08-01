import { Link } from 'react-router-dom'
import { useSite } from '@/components/site-provider'
import type { JourneyStage } from '@/features/donations/donation-store'
import { cn } from '@/lib/utils'

const STAGES: JourneyStage[] = ['received', 'matched', 'session_update']

export type GiftJourneyItem = {
  id: string
  amount_hkd: number
  created_at: string
  stage: JourneyStage | string
  programme?: string
  frequency?: string
  session_title?: string
  session_when?: string
}

function stageStatus(current: string, stage: JourneyStage, index: number) {
  const currentIndex = Math.max(0, STAGES.indexOf(current as JourneyStage))
  if (index < currentIndex) return 'done' as const
  if (index === currentIndex) {
    return stage === 'session_update' ? ('done' as const) : ('processing' as const)
  }
  return 'waiting' as const
}

export type GrowthStage = 1 | 2 | 3 | 4

export function clampGrowthStage(n: number): GrowthStage {
  if (!Number.isFinite(n)) return 1
  return Math.min(4, Math.max(1, Math.round(n))) as GrowthStage
}

export function isSessionGiftStage(stage: string) {
  return stage === 'session_update'
}

function growthLevel(current: string): GrowthStage {
  const i = STAGES.indexOf(current as JourneyStage)
  if (i < 0) return 1
  if (current === 'session_update') return 3
  return (i + 1) as GrowthStage
}

/**
 * Cumulative grove only — stage 4 unlocks when gifts together tell a fuller story
 * (a completed session plus more than one gift, or multiple sessions).
 * Per-gift trees stay capped at 3.
 */
export function cumulativeGrowthLevel(gifts: GiftJourneyItem[]): GrowthStage {
  if (!gifts.length) return 1
  const levels = gifts.map((gift) => growthLevel(gift.stage))
  const furthest = Math.max(...levels)
  const points = levels.reduce((sum, n) => sum + n, 0)
  const averaged = Math.min(3, Math.max(1, Math.round(points / gifts.length)))
  const base = Math.max(furthest, averaged) as 1 | 2 | 3
  const sessionCount = levels.filter((n) => n >= 3).length

  if (sessionCount >= 2) return 4
  if (sessionCount >= 1 && gifts.length >= 2) return 4
  if (furthest >= 3 && gifts.length >= 3) return 4
  return base
}

export function GrowingTree({
  level,
  fruitCount = 0,
}: {
  level: number
  /** Extra fruit for gifts that reached a session (cumulative only). */
  fruitCount?: number
}) {
  // Trunk foot sits in the soil mound; soil is drawn first so bark paints on top.
  const trunkTop = level >= 4 ? 58 : level >= 3 ? 72 : level >= 2 ? 100 : 150
  const trunkBottom = 190
  const trunkHeight = trunkBottom - trunkTop
  const fruits = Math.min(
    8,
    Math.max(level >= 4 ? 6 : level >= 3 ? 3 : 0, fruitCount + (level >= 4 ? 2 : 0)),
  )

  return (
    <svg
      viewBox="0 0 160 200"
      className="h-44 w-36 shrink-0 sm:h-52 sm:w-40"
      aria-hidden
    >
      {/* Soil — behind the trunk */}
      <ellipse cx="80" cy="186" rx="56" ry="12" fill="#d4b896" />
      <ellipse cx="80" cy="184" rx="40" ry="8" fill="#c4a574" />
      {level >= 4 && (
        <>
          <ellipse cx="42" cy="188" rx="22" ry="7" fill="#d4b896" opacity="0.85" />
          <ellipse cx="118" cy="188" rx="22" ry="7" fill="#d4b896" opacity="0.85" />
        </>
      )}

      {/* Branches + foliage (under trunk so bark stays crisp in front) */}
      {level === 1 && (
        <g className="transition-opacity duration-500">
          <path
            d="M80 150 C76 136 68 126 58 118"
            fill="none"
            stroke="#4a7c2c"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M80 150 C84 138 92 130 102 124"
            fill="none"
            stroke="#5d9b35"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <ellipse
            cx="54"
            cy="114"
            rx="13"
            ry="8"
            fill="#7cb342"
            transform="rotate(-38 54 114)"
          />
          <ellipse
            cx="104"
            cy="122"
            rx="10"
            ry="6"
            fill="#66a03a"
            transform="rotate(28 104 122)"
          />
        </g>
      )}

      {level === 2 && (
        <g className="transition-opacity duration-700">
          <path
            d="M80 130 C58 124 44 110 36 96"
            fill="none"
            stroke="#5c4033"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M80 118 C102 112 116 98 124 86"
            fill="none"
            stroke="#5c4033"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="34" cy="92" r="18" fill="#5d9b35" />
          <circle cx="126" cy="82" r="17" fill="#66a03a" />
          <circle cx="80" cy="78" r="22" fill="#4a8f2e" />
          <circle cx="62" cy="88" r="14" fill="#7cb342" />
          <circle cx="98" cy="86" r="13" fill="#66a03a" />
        </g>
      )}

      {level === 3 && (
        <g className="transition-opacity duration-700">
          <path
            d="M80 120 C55 114 40 100 32 86"
            fill="none"
            stroke="#5c4033"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M80 108 C105 102 120 88 128 74"
            fill="none"
            stroke="#5c4033"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="80" cy="52" r="34" fill="#4a8f2e" />
          <circle cx="48" cy="68" r="24" fill="#5d9b35" />
          <circle cx="112" cy="64" r="26" fill="#5d9b35" />
          <circle cx="66" cy="42" r="20" fill="#66a03a" />
          <circle cx="96" cy="40" r="18" fill="#7cb342" />
          <circle cx="80" cy="72" r="16" fill="#66a03a" />
          {(
            [
              [56, 54, '#e4002b'],
              [100, 48, '#ffc72c'],
              [88, 66, '#e4002b'],
              [70, 38, '#ffc72c'],
              [44, 60, '#e4002b'],
              [110, 72, '#ffc72c'],
            ] as const
          )
            .slice(0, fruits)
            .map(([cx, cy, fill], index) => (
              <circle
                key={`${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r={index === 0 ? 5 : 4}
                fill={fill}
                className={index === 0 ? 'animate-pulse' : undefined}
              />
            ))}
        </g>
      )}

      {/* Stage 4 — structure first so main trunk/branches sit behind bushes */}
      {level >= 4 && (
        <g className="transition-opacity duration-700">
          <rect
            x="74"
            y={trunkTop}
            width="12"
            height={trunkHeight}
            rx="4"
            fill="#5c4033"
          />
          <path
            d="M80 110 C48 102 28 88 18 68"
            fill="none"
            stroke="#5c4033"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M80 100 C112 92 132 78 142 58"
            fill="none"
            stroke="#5c4033"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect x="36" y="150" width="7" height="36" rx="2" fill="#6b4f3a" />
          <rect x="117" y="148" width="7" height="38" rx="2" fill="#6b4f3a" />
          {/* Side bushes — in front of the main trunk */}
          <circle cx="40" cy="140" r="16" fill="#66a03a" />
          <circle cx="28" cy="148" r="11" fill="#7cb342" />
          <circle cx="48" cy="152" r="10" fill="#5d9b35" />
          <circle cx="120" cy="136" r="17" fill="#5d9b35" />
          <circle cx="132" cy="146" r="12" fill="#7cb342" />
          <circle cx="112" cy="150" r="10" fill="#66a03a" />
          {/* Main canopy — in front of upper branches */}
          <circle cx="80" cy="44" r="40" fill="#3f7f28" />
          <circle cx="42" cy="62" r="28" fill="#4a8f2e" />
          <circle cx="118" cy="58" r="30" fill="#4a8f2e" />
          <circle cx="62" cy="32" r="22" fill="#5d9b35" />
          <circle cx="100" cy="30" r="20" fill="#66a03a" />
          <circle cx="80" cy="68" r="18" fill="#66a03a" />
          <circle cx="54" cy="48" r="14" fill="#7cb342" />
          <circle cx="108" cy="46" r="14" fill="#7cb342" />
          {(
            [
              [52, 42, '#e4002b'],
              [98, 36, '#ffc72c'],
              [84, 58, '#e4002b'],
              [66, 28, '#ffc72c'],
              [36, 56, '#e4002b'],
              [118, 52, '#ffc72c'],
              [74, 44, '#e4002b'],
              [106, 68, '#ffc72c'],
            ] as const
          )
            .slice(0, fruits)
            .map(([cx, cy, fill], index) => (
              <circle
                key={`g4-${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r={index < 2 ? 5 : 4}
                fill={fill}
                className={index === 0 ? 'animate-pulse' : undefined}
              />
            ))}
        </g>
      )}

      {/* Levels 1–3: trunk last so bark sits cleanly on the soil */}
      {level < 4 && (
        <rect
          x="74"
          y={trunkTop}
          width="12"
          height={trunkHeight}
          rx="4"
          fill="#5c4033"
          className="transition-all duration-700 ease-out"
        />
      )}
    </svg>
  )
}

/**
 * Gift journey as a growing tree — seed → rooted in a programme → session canopy.
 */
export function GiftJourneyTree({ gifts }: { gifts: GiftJourneyItem[] }) {
  const { t } = useSite()
  const m = t.me
  const g = t.give
  const overallLevel = cumulativeGrowthLevel(gifts)
  const totalGiven = gifts.reduce((sum, gift) => sum + gift.amount_hkd, 0)
  const sessionGifts = gifts.filter((gift) => growthLevel(gift.stage) >= 3).length

  function programmeLabel(programme?: string) {
    if (!programme) return g.programmes.where_needed
    const key = programme as keyof typeof g.programmes
    return g.programmes[key] ?? programme
  }

  function frequencyLabel(frequency?: string) {
    if (frequency === 'weekly') return g.weekly
    if (frequency === 'monthly') return g.monthly
    if (frequency === 'once') return g.once
    return null
  }

  function fill(template: string, programme?: string) {
    return template.replace('{programme}', programmeLabel(programme))
  }

  function stageTitle(stage: JourneyStage) {
    if (stage === 'received') return m.journeyReceived
    if (stage === 'matched') return m.journeyMatched
    return m.journeySession
  }

  function statusLabel(status: 'done' | 'processing' | 'waiting') {
    if (status === 'done') return m.journeyStatusDone
    if (status === 'processing') return m.journeyStatusProcessing
    return m.journeyStatusWaiting
  }

  function statusDetail(
    gift: GiftJourneyItem,
    stage: JourneyStage,
    status: 'done' | 'processing' | 'waiting',
  ) {
    if (status === 'done') {
      if (stage === 'received') return m.journeyDetailReceivedDone
      if (stage === 'matched') return fill(m.journeyDetailMatchedDone, gift.programme)
      if (gift.session_title && gift.session_when) {
        return m.journeyDetailSessionDoneNamed
          .replace('{title}', gift.session_title)
          .replace('{when}', gift.session_when)
      }
      return fill(m.journeyDetailSessionDone, gift.programme)
    }
    if (status === 'processing') {
      if (stage === 'received') return m.journeyDetailReceivedProcessing
      if (stage === 'matched') return fill(m.journeyDetailMatchedProcessing, gift.programme)
      return fill(m.journeyDetailSessionProcessing, gift.programme)
    }
    if (stage === 'matched') return fill(m.journeyDetailMatchedWaiting, gift.programme)
    if (stage === 'session_update') return fill(m.journeyDetailSessionWaiting, gift.programme)
    return m.journeyDetailReceivedWaiting
  }

  return (
    <div className="mt-8 space-y-10">
      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-gradient-to-br from-[#eef7ec] via-white to-[#f7f1e6]">
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
          <div className="flex flex-col items-center rounded-xl bg-gradient-to-b from-teal/5 to-[#e8dcc8]/50 px-5 pt-4 pb-3">
            <GrowingTree level={overallLevel} fruitCount={sessionGifts} />
            <p className="mt-1 text-center text-[11px] font-semibold tracking-wide text-navy/45 uppercase">
              {m.journeyGrowthCumulativeLabel.replace('{n}', String(overallLevel))}
            </p>
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h3 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
              {m.journeyGrowthCumulativeTitle}
            </h3>
            <p className="mt-2 max-w-lg text-navy/70">{m.journeyGrowthCumulativeBody}</p>
            <dl className="mt-5 grid grid-cols-3 gap-3 sm:max-w-md">
              <div className="rounded-xl bg-white/80 px-3 py-3">
                <dt className="text-[11px] font-semibold tracking-wide text-navy/45 uppercase">
                  {m.journeyGrowthTotalGiven}
                </dt>
                <dd className="mt-1 font-display text-xl font-semibold text-navy">
                  HK${totalGiven.toLocaleString()}
                </dd>
              </div>
              <div className="rounded-xl bg-white/80 px-3 py-3">
                <dt className="text-[11px] font-semibold tracking-wide text-navy/45 uppercase">
                  {m.journeyGrowthGiftCount}
                </dt>
                <dd className="mt-1 font-display text-xl font-semibold text-navy">
                  {gifts.length}
                </dd>
              </div>
              <div className="rounded-xl bg-white/80 px-3 py-3">
                <dt className="text-[11px] font-semibold tracking-wide text-navy/45 uppercase">
                  {m.journeyGrowthSessions}
                </dt>
                <dd className="mt-1 font-display text-xl font-semibold text-navy">
                  {sessionGifts}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <ul className="space-y-10">
      {gifts.map((gift) => {
        const level = growthLevel(gift.stage)
        const freq = frequencyLabel(gift.frequency)
        return (
          <li
            key={gift.id}
            className="overflow-hidden rounded-2xl border border-navy/10 bg-gradient-to-b from-[#f4faf3] via-white to-white"
          >
            <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-stretch sm:gap-8 sm:p-7">
              <div className="flex flex-col items-center justify-end rounded-xl bg-gradient-to-b from-teal/5 to-[#e8dcc8]/40 px-4 pt-4 pb-2">
                <GrowingTree level={level} />
                <p className="mt-1 text-center text-[11px] font-semibold tracking-wide text-navy/45 uppercase">
                  {m.journeyGrowthLabel.replace('{n}', String(level))}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-display text-2xl font-semibold text-navy">
                      HK${gift.amount_hkd.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-navy/55">
                      {new Date(gift.created_at).toLocaleDateString()}
                      {freq ? ` · ${freq}` : ''}
                      {gift.programme ? ` · ${programmeLabel(gift.programme)}` : ''}
                    </p>
                  </div>
                  <Link
                    to={`/give/thanks?donation=${gift.id}`}
                    className="shrink-0 font-semibold text-navy underline-offset-4 hover:underline"
                  >
                    {m.viewGift} →
                  </Link>
                </div>

                <ol className="relative mt-8 ml-2 border-l-2 border-teal/25 pl-7">
                  {STAGES.map((stage, index) => {
                    const status = stageStatus(gift.stage, stage, index)
                    return (
                      <li key={stage} className="relative pb-7 last:pb-0">
                        <span
                          className={cn(
                            'absolute top-1 -left-[calc(0.875rem+5px)] flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full ring-4 ring-white',
                            status === 'done' && 'bg-teal',
                            status === 'processing' && 'bg-yellow animate-pulse',
                            status === 'waiting' && 'bg-navy/15',
                          )}
                          aria-hidden
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={cn(
                              'font-semibold',
                              status === 'waiting' ? 'text-navy/35' : 'text-navy',
                            )}
                          >
                            {stageTitle(stage)}
                          </p>
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase',
                              status === 'done' && 'bg-teal/15 text-teal',
                              status === 'processing' && 'bg-yellow/80 text-navy',
                              status === 'waiting' && 'bg-navy/5 text-navy/45',
                            )}
                          >
                            {statusLabel(status)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            'mt-1.5 max-w-lg text-sm leading-relaxed',
                            status === 'waiting' ? 'text-navy/35' : 'text-navy/70',
                          )}
                        >
                          {statusDetail(gift, stage, status)}
                        </p>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>
          </li>
        )
      })}
      </ul>
    </div>
  )
}
