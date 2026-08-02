import { Link } from 'react-router-dom'
import { useSite } from '@/components/site-provider'
import { BrandLogo } from '@/components/brand-logo'

export function SiteFooter() {
  const { t } = useSite()

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 md:grid-cols-4">
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
                {t.footer.explore}
              </p>
              {[
                ['/', t.nav.home],
                ['/community', t.nav.community],
                ['/volunteer', t.nav.volunteer],
                ['/give', t.nav.give],
                ['/me', t.nav.myImpact],
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
                {t.footer.more}
              </p>
              <Link
                to="/support"
                className="min-h-[40px] py-1 text-sm font-medium text-white/85 hover:text-yellow"
              >
                {t.footer.support}
              </Link>
              <a
                href="https://love21foundation.com/our-story/"
                target="_blank"
                rel="noreferrer"
                className="min-h-[40px] py-1 text-sm font-medium text-white/85 hover:text-yellow"
              >
                {t.footer.aboutLove21}
              </a>
              <a
                href="https://love21foundation.com/wp-content/uploads/2026/04/Annualreport_final.pdf"
                target="_blank"
                rel="noreferrer"
                className="min-h-[40px] py-1 text-sm font-medium text-white/85 hover:text-yellow"
              >
                {t.footer.annualReport}
              </a>
              <Link
                to="/admin"
                className="min-h-[40px] py-1 text-sm font-medium text-white/50 hover:text-yellow"
              >
                {t.nav.admin}
              </Link>
            </div>
          </div>

          {/* Real details from love21foundation.com/contact-us. Two addresses because
              the foundation has two: the Space where activities run, and a separate
              floor for post. The addresses stay in English — they are how the building
              is signed, and inventing a Chinese rendering we cannot verify would be
              worse than not translating. */}
          <address className="flex flex-col gap-1 not-italic">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-yellow uppercase">
              {t.footer.contact}
            </p>

            <p className="text-sm leading-relaxed text-white/85">
              <span className="block text-white/55">{t.footer.contactSpace}</span>
              2/F, Artisan Lab, 21 Luk Hop Street
              <br />
              San Po Kong, Kowloon
            </p>

            <p className="mt-3 text-sm leading-relaxed text-white/85">
              <span className="block text-white/55">{t.footer.contactOffice}</span>
              1102, 11/F, Artisan Lab, 21 Luk Hop Street
              <br />
              San Po Kong, Kowloon
            </p>

            <a
              href="mailto:info@love21foundation.com"
              className="mt-3 min-h-[40px] py-1 text-sm font-medium text-white/85 hover:text-yellow"
            >
              <span className="block text-white/55">{t.footer.contactEnquiries}</span>
              info@love21foundation.com
            </a>
            <a
              href="mailto:jeff@love21foundation.com"
              className="min-h-[40px] py-1 text-sm font-medium text-white/85 hover:text-yellow"
            >
              <span className="block text-white/55">{t.footer.contactPartnerships}</span>
              jeff@love21foundation.com
            </a>

            <div className="mt-3 flex gap-4">
              <a
                href="https://www.instagram.com/love21foundation/"
                target="_blank"
                rel="noreferrer"
                className="min-h-[40px] py-1 text-sm font-medium text-white/85 hover:text-yellow"
              >
                Instagram ↗
              </a>
              <a
                href="https://www.facebook.com/Love21foundation/"
                target="_blank"
                rel="noreferrer"
                className="min-h-[40px] py-1 text-sm font-medium text-white/85 hover:text-yellow"
              >
                Facebook ↗
              </a>
            </div>
          </address>
        </div>

        <div className="mt-12 border-t border-white/15 pt-6 text-xs text-white/45">
          © {new Date().getFullYear()} Love 21 Foundation. {t.footer.rights}
        </div>
      </div>
    </footer>
  )
}
