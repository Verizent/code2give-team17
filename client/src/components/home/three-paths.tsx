import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useSite } from '@/components/site-provider'

export function ThreePaths() {
  const { t } = useSite()

  const paths = [
    {
      key: 'witness',
      data: t.paths.witness,
      href: '/community',
      surface: 'bg-white border-black/8',
      tag: 'text-teal',
      title: 'text-navy',
      body: 'text-navy/70',
      cta: 'text-navy',
    },
    {
      key: 'take',
      data: t.paths.take,
      href: '/volunteer',
      surface: 'bg-navy border-navy',
      tag: 'text-yellow',
      title: 'text-white',
      body: 'text-white/75',
      cta: 'text-yellow',
    },
    {
      key: 'support',
      data: t.paths.support,
      href: '/give',
      surface: 'bg-white border-black/8',
      tag: 'text-red',
      title: 'text-navy',
      body: 'text-navy/70',
      cta: 'text-red',
    },
  ] as const

  return (
    <section aria-labelledby="paths-title" className="bg-red py-16 sm:py-24">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <h2
          id="paths-title"
          className="font-display text-[clamp(2rem,4.5vw,2.75rem)] font-extrabold tracking-[-0.02em] text-white"
        >
          {t.paths.title}
        </h2>
        <p className="section-lede section-lede-on-dark mt-3 max-w-xl text-lg leading-relaxed font-medium text-white sm:text-xl">
          {t.paths.subhead}
        </p>

        <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-3">
          {paths.map(({ key, data, href, surface, tag, title, body, cta }) => (
            <Link
              key={key}
              to={href}
              className={`group flex flex-col rounded-xl border p-6 transition-shadow hover:shadow-[0_8px_24px_rgba(20,40,75,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-8 ${surface}`}
            >
              <span className={`text-[11px] font-semibold tracking-[0.06em] uppercase ${tag}`}>
                {data.tag}
              </span>
              <h3 className={`mt-3 font-display text-[1.4rem] leading-tight font-semibold sm:text-[1.55rem] ${title}`}>
                {data.title}
              </h3>
              <p className={`mt-3 flex-1 text-[15px] leading-relaxed ${body}`}>{data.body}</p>
              <span className={`mt-6 inline-flex items-center gap-2 text-[14px] font-semibold ${cta}`}>
                {data.cta}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
