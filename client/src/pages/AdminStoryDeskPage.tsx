import { useEffect, useState } from 'react'
import {
  approveProof,
  fetchProofs,
  fetchSocialDrafts,
  markSocialCopied,
  scheduleSocialDraft,
  type ProofItem,
  type SocialDraft,
} from '@/features/admin/api'
import { instagramProfileUrl, SUGGESTED_HASHTAGS } from '@/features/admin/instagram'
import { useSite } from '@/components/site-provider'
import { ApiError } from '@/lib/apiClient'
import { cn } from '@/lib/utils'

function downloadCaption(draft: SocialDraft) {
  const blob = new Blob([draft.caption], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${draft.channel}-${draft.lang}-${draft.id}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Approve session photos → persist → copy captions for Instagram/Facebook.
 * Does not publish to Meta Graph.
 */
export function AdminStoryDeskPage() {
  const { t } = useSite()
  const a = t.admin
  const [proofs, setProofs] = useState<ProofItem[]>([])
  const [drafts, setDrafts] = useState<SocialDraft[]>([])
  const [available, setAvailable] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [selected, setSelected] = useState<ProofItem | null>(null)
  const profileUrl = instagramProfileUrl()

  const consentLabel = {
    consented: { label: a.consentCleared, className: 'text-teal' },
    partial: { label: a.consentPartial, className: 'text-navy' },
    none: { label: a.consentNone, className: 'text-red' },
  } as const

  async function load() {
    try {
      const [nextProofs, nextDrafts] = await Promise.all([
        fetchProofs(),
        fetchSocialDrafts(),
      ])
      setProofs(nextProofs.items)
      setDrafts(nextDrafts.items)
      setAvailable(nextProofs.available && nextDrafts.available)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? a.storiesLoadError : a.storiesLoadError)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function onApprove(id: string) {
    setBusyId(id)
    setMsg(null)
    try {
      const proof = await approveProof(id)
      setSelected(proof)
      setMsg(a.storiesApproved)
      await load()
    } catch {
      setError(a.storiesApproveError)
    } finally {
      setBusyId(null)
    }
  }

  async function onCopy(draft: SocialDraft) {
    setBusyId(draft.id)
    setMsg(null)
    try {
      await navigator.clipboard.writeText(draft.caption)
      await markSocialCopied(draft.id)
      setMsg(a.storiesCopied)
      await load()
    } catch {
      setMsg(a.storiesCopyFailed)
    } finally {
      setBusyId(null)
    }
  }

  async function onQueue(draft: SocialDraft) {
    setBusyId(draft.id)
    try {
      const when = new Date()
      when.setDate(when.getDate() + 1)
      when.setUTCHours(10, 0, 0, 0)
      await scheduleSocialDraft(draft.id, when.toISOString())
      setMsg(a.storiesReminded.replace('{when}', when.toLocaleString()))
      await load()
    } catch {
      setError(a.storiesScheduleError)
    } finally {
      setBusyId(null)
    }
  }

  const pending = proofs.filter((p) => p.status === 'pending')

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
        {a.storiesTitle}
      </h1>
      <p className="mt-2 max-w-2xl text-navy/70">{a.storiesIntro}</p>
      <p className="mt-2 text-sm text-navy/55">{a.storiesMetaNote}</p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red/10 px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}
      {msg && (
        <p className="mt-4 text-sm font-medium text-teal" role="status">
          {msg}
        </p>
      )}

      {!available ? (
        <p className="mt-8 max-w-xl text-navy/70">{a.storiesUnavailable}</p>
      ) : (
        <>
          <section aria-labelledby="approve-heading" className="mt-10">
            <h2 id="approve-heading" className="font-display text-2xl font-semibold text-navy">
              {a.storiesApproveHeading}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-navy/65">{a.storiesApproveLead}</p>

            <ul className="mt-6 space-y-6">
              {pending.length === 0 ? (
                <li className="text-navy/70">{a.storiesNoPending}</li>
              ) : (
                pending.map((proof) => {
                  const consent = consentLabel[proof.consent]
                  return (
                    <li
                      key={proof.id}
                      className="flex flex-col gap-4 border-b border-navy/10 pb-6 sm:flex-row sm:items-start"
                    >
                      <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-xl bg-navy/5">
                        <img
                          src={proof.thumb}
                          alt=""
                          className={cn(
                            'h-full w-full object-cover',
                            proof.consent !== 'consented' && 'scale-105 blur-sm',
                          )}
                        />
                        {proof.consent !== 'consented' && (
                          <span className="absolute inset-x-0 bottom-0 bg-navy/70 px-2 py-1 text-[10px] font-semibold text-white">
                            {a.storiesBlurActive}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-xl font-semibold text-navy">{proof.title}</p>
                        <p className="mt-1 text-sm text-navy/60">
                          {proof.programme} · {new Date(proof.captured_at).toLocaleDateString()}
                        </p>
                        <p className={cn('mt-2 text-sm font-semibold', consent.className)}>
                          {consent.label}
                        </p>
                        <p className="mt-1 text-sm text-navy/60">
                          {a.storiesMembers
                            .replace('{visible}', String(proof.members_visible))
                            .replace('{blurred}', String(proof.members_blurred))}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === proof.id}
                        onClick={() => void onApprove(proof.id)}
                        className="inline-flex min-h-11 shrink-0 items-center rounded-md bg-teal px-5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {a.storiesApproveCta}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </section>

          {selected?.fanout && (
            <section aria-labelledby="fanout-heading" className="mt-12">
              <h2 id="fanout-heading" className="font-display text-2xl font-semibold text-navy">
                {a.storiesFanoutHeading}
              </h2>
              <p className="mt-1 text-sm text-navy/65">{selected.fanout.blur_note}</p>
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <article className="border-t border-navy/10 pt-4">
                  <p className="text-xs font-bold tracking-wide text-navy/45 uppercase">
                    {a.storiesWebsiteStory}
                  </p>
                  <p className="mt-2 font-semibold text-navy">
                    {selected.fanout.website_story.headline}
                  </p>
                  <p className="mt-2 text-sm text-navy/70">{selected.fanout.website_story.excerpt}</p>
                  <p className="mt-3 text-xs text-teal">{selected.fanout.website_story.path}</p>
                </article>
                <article className="border-t border-navy/10 pt-4 lg:col-span-2">
                  <p className="text-xs font-bold tracking-wide text-navy/45 uppercase">
                    {a.storiesCaptionDrafts} · {selected.fanout.languages.join(' · ')}
                  </p>
                  <ul className="mt-3 space-y-3">
                    {selected.fanout.drafts.map((d) => (
                      <li key={`${d.channel}-${d.lang}`} className="text-sm">
                        <p className="font-semibold text-navy">
                          {d.channel} · {d.lang}
                        </p>
                        <pre className="mt-1 whitespace-pre-wrap font-sans text-navy/75">
                          {d.caption}
                        </pre>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>
          )}

          <section aria-labelledby="captions-heading" className="mt-14 border-t border-navy/10 pt-10">
            <h2 id="captions-heading" className="font-display text-2xl font-semibold text-navy">
              {a.storiesCaptionsHeading}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-navy/65">{a.storiesCaptionsLead}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={profileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-md bg-navy px-4 text-sm font-semibold text-white"
              >
                {a.storiesOpenInstagram}
              </a>
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(SUGGESTED_HASHTAGS)}
                className="inline-flex min-h-11 items-center rounded-md border border-navy/20 px-4 text-sm font-semibold text-navy"
              >
                {a.storiesCopyHashtags}
              </button>
            </div>

            <ul className="mt-8 space-y-6">
              {drafts.length === 0 ? (
                <li className="text-navy/70">{a.storiesNoDrafts}</li>
              ) : (
                drafts.map((draft) => (
                  <li key={draft.id} className="border-b border-navy/10 pb-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-navy">
                        {draft.channel} · {draft.lang}
                        <span className="ml-2 text-sm font-normal text-navy/55">{draft.status}</span>
                      </p>
                      {draft.scheduled_for && (
                        <p className="text-sm text-navy/55">
                          {a.storiesReminder} {new Date(draft.scheduled_for).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <pre className="mt-3 max-w-2xl whitespace-pre-wrap rounded-md border border-navy/10 bg-white/80 p-4 font-sans text-sm text-navy/80">
                      {draft.caption}
                    </pre>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === draft.id}
                        onClick={() => void onCopy(draft)}
                        className="inline-flex min-h-11 items-center rounded-md bg-teal px-4 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {a.storiesCopyCaption}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadCaption(draft)}
                        className="inline-flex min-h-11 items-center rounded-md border border-navy/20 px-4 text-sm font-semibold text-navy"
                      >
                        {a.storiesDownload}
                      </button>
                      {draft.status !== 'queued' && (
                        <button
                          type="button"
                          disabled={busyId === draft.id}
                          onClick={() => void onQueue(draft)}
                          className="inline-flex min-h-11 items-center rounded-md border border-navy/20 px-4 text-sm font-semibold text-navy disabled:opacity-60"
                        >
                          {a.storiesRemind}
                        </button>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
