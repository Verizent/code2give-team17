import { useState } from 'react'
import { useSite } from '@/components/site-provider'
import type { Locale } from '@/lib/strings'
import {
  saveLocalPrefs,
  type LocalMePrefs,
  type MeAccountPrefs,
} from '@/features/me/impact'

/**
 * PAGE 5.4 — profile, language, notifications, consent.
 * Notification / photo prefs persist on this device until a profile API owns them.
 * Language uses the shared SiteProvider i18n (`setLocale` → `strings.ts`).
 */
export function AccountConsent({
  account,
  onSignOut,
}: {
  account: MeAccountPrefs
  onSignOut: () => void
}) {
  const { t, locale, setLocale } = useSite()
  const m = t.me
  const [prefs, setPrefs] = useState<LocalMePrefs>(() => ({
    journey_updates: account.journey_updates,
    email_notifications: account.email_notifications,
    photo_story_consent: account.photo_story_consent,
  }))
  const [saved, setSaved] = useState(false)

  function updatePref<K extends keyof LocalMePrefs>(key: K, value: LocalMePrefs[K]) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    saveLocalPrefs(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  function chooseLocale(next: Locale) {
    setLocale(next)
  }

  return (
    <section aria-labelledby="account-title" className="mt-14">
      <p className="kicker text-navy/50">{m.accountKicker}</p>
      <h2 id="account-title" className="mt-2 font-display text-3xl font-semibold text-navy">
        {m.accountTitle}
      </h2>
      <p className="mt-3 max-w-xl text-navy/70">{m.accountBody}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="font-semibold text-navy">{m.accountProfile}</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-navy/45">{m.accountEmail}</dt>
              <dd className="mt-0.5 font-medium text-navy">{account.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-navy/45">{m.accountName}</dt>
              <dd className="mt-0.5 font-medium text-navy">{account.full_name ?? '—'}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-6 rounded-md border border-navy/20 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
          >
            {m.logOut}
          </button>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="font-semibold text-navy">{m.accountLanguage}</h3>
            <p className="mt-1 text-sm text-navy/60">{m.accountLanguageHint}</p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={m.accountLanguage}>
              {(
                [
                  { id: 'en', label: 'English' },
                  { id: 'zh-Hant', label: '繁體中文' },
                  { id: 'zh-Hans', label: '简体中文' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => chooseLocale(opt.id)}
                  aria-pressed={locale === opt.id}
                  className={
                    locale === opt.id
                      ? 'min-h-10 rounded-md bg-navy px-4 text-sm font-semibold text-white'
                      : 'min-h-10 rounded-md border border-navy/20 px-4 text-sm font-semibold text-navy hover:bg-navy/5'
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <fieldset>
            <legend className="font-semibold text-navy">{m.accountNotifications}</legend>
            <p className="mt-1 text-sm text-navy/60">{m.accountNotificationsHint}</p>
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-teal"
                checked={prefs.journey_updates}
                onChange={(e) => updatePref('journey_updates', e.target.checked)}
              />
              <span>
                <span className="font-medium text-navy">{m.accountJourneyOptIn}</span>
                <span className="mt-0.5 block text-sm text-navy/60">
                  {m.accountJourneyOptInHint}
                </span>
              </span>
            </label>
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-teal"
                checked={prefs.email_notifications}
                onChange={(e) => updatePref('email_notifications', e.target.checked)}
              />
              <span>
                <span className="font-medium text-navy">{m.accountEmailOptIn}</span>
                <span className="mt-0.5 block text-sm text-navy/60">
                  {m.accountEmailOptInHint}
                </span>
              </span>
            </label>
          </fieldset>

          <fieldset>
            <legend className="font-semibold text-navy">{m.accountConsent}</legend>
            <p className="mt-1 text-sm text-navy/60">{m.accountConsentHint}</p>
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-teal"
                checked={prefs.photo_story_consent}
                onChange={(e) => updatePref('photo_story_consent', e.target.checked)}
              />
              <span>
                <span className="font-medium text-navy">{m.accountPhotoConsent}</span>
                <span className="mt-0.5 block text-sm text-navy/60">
                  {m.accountPhotoConsentHint}
                </span>
              </span>
            </label>
          </fieldset>

          {saved ? (
            <p className="text-sm font-medium text-teal" role="status">
              {m.accountSaved}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

