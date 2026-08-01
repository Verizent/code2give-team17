import { useEffect, useState } from 'react'
import {
  fetchAttendance,
  markSignupAttended,
  type AttendanceSession,
} from '@/features/admin/api'
import { useSite } from '@/components/site-provider'
import { ApiError } from '@/lib/apiClient'

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function AdminAttendancePage() {
  const { t } = useSite()
  const a = t.admin
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [range, setRange] = useState({ from: '', to: '' })
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    try {
      const result = await fetchAttendance()
      setSessions(result.sessions)
      setRange({ from: result.from, to: result.to })
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? 'Could not load attendance.' : 'Could not load attendance.')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function mark(signupId: string) {
    setBusyId(signupId)
    try {
      await markSignupAttended(signupId)
      await load()
    } catch {
      setError('Could not mark attendance.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">{a.attendanceTitle}</h1>
      <p className="mt-2 max-w-2xl text-navy/70">{a.attendanceIntro}</p>
      {range.from && (
        <p className="mt-2 text-sm text-navy/55">
          {formatWhen(range.from)} – {formatWhen(range.to)}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red/10 px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}

      {sessions.length === 0 ? (
        <p className="mt-8 text-navy/70">No sessions in this window.</p>
      ) : (
        <ul className="mt-8 space-y-10">
          {sessions.map((session) => (
            <li key={session.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-navy/10 pb-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-navy">{session.title}</h2>
                  <p className="mt-1 text-sm text-navy/60">
                    {formatWhen(session.starts_at)}
                    {session.location ? ` · ${session.location}` : ''}
                  </p>
                </div>
                <p className="text-sm font-semibold text-teal">
                  {session.headcount_confirmed}/{session.headcount_expected} attended
                </p>
              </div>
              {session.signups.length === 0 ? (
                <p className="mt-3 text-sm text-navy/60">No signups yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-navy/8">
                  {session.signups.map((signup) => (
                    <li
                      key={signup.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="font-medium text-navy">
                          {signup.volunteer.full_name || 'Volunteer'}
                        </p>
                        <p className="text-sm text-navy/55">
                          {signup.volunteer.email} · {signup.status}
                          {signup.status === 'attended' && signup.hours_logged
                            ? ` · ${signup.hours_logged}h`
                            : ''}
                        </p>
                      </div>
                      {signup.status !== 'attended' && signup.status !== 'no_show' ? (
                        <button
                          type="button"
                          disabled={busyId === signup.id}
                          onClick={() => void mark(signup.id)}
                          className="min-h-11 rounded-md bg-teal px-4 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          Mark attended
                        </button>
                      ) : (
                        <span className="text-sm font-semibold text-navy/45">Done</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
