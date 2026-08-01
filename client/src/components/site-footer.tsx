import { Link } from 'react-router-dom'
import { useSite } from '@/components/site-provider'
import { BrandLogo } from '@/components/brand-logo'

export function SiteFooter() {
  const { t } = useSite()

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="max-w-sm">
            <span className="inline-flex rounded-md bg-yellow px-2.5 py-2">
              <BrandLogo markClassName="h-9 sm:h-10" />
            </span>
            <p className="mt-5 text-sm leading-relaxed text-white/70">
              #Somuchability · San Po Kong, Hong Kong
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{t.footer.tax}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-yellow uppercase">
                Explore
              </p>
              {[
                ['/', t.nav.home],
                ['/community', t.nav.community],
                ['/volunteer', t.nav.volunteer],
                ['/give', t.nav.give],
                ['/me', 'My Impact'],
              ].map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="min-h-[40px] py-1 text-sm font-medium text-white/85 hover:text-yellow"
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-yellow uppercase">
                More
              </p>
              <a
                href="https://love21foundation.com/our-story/"
                target="_blank"
                rel="noreferrer"
                className="min-h-[40px] py-1 text-sm font-medium text-white/85 hover:text-yellow"
              >
                About Love 21 ↗
              </a>
              <a
                href="https://love21foundation.com/wp-content/uploads/2026/04/Annualreport_final.pdf"
                target="_blank"
                rel="noreferrer"
                className="min-h-[40px] py-1 text-sm font-medium text-white/85 hover:text-yellow"
              >
                Annual Report ↗
              </a>
              <Link
                to="/admin"
                className="min-h-[40px] py-1 text-sm font-medium text-white/50 hover:text-yellow"
              >
                Admin Studio
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/15 pt-6 text-xs text-white/45">
          © {new Date().getFullYear()} Love 21 Foundation. {t.footer.rights}
        </div>
      </div>
    </footer>
  )
}
