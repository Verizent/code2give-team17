import React, { useEffect, useState } from 'react'
import { SkipLink } from '@/components/skip-link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useSite } from '@/components/site-provider'
import { LovePatternBg, BrandPatternBand } from '@/components/brand-pattern'

export function AboutPage() {
  const { t, locale } = useSite()
  const isZh = locale !== 'en'
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.about-parallax'))
    let raf = 0
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        els.forEach((el) => {
          const rect = el.getBoundingClientRect()
          const offset = rect.top * 0.06
          const s = el.dataset.key === active ? 1.06 : 1
          el.style.transform = `translateY(${offset}px) scale(${s})`
        })
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [active])

  function makeSection(key: string, img: string, emoji: string, en: React.ReactNode, zh: React.ReactNode) {
    return (
      <section
        key={key}
        className="relative overflow-hidden rounded-2xl min-h-[48vh] sm:min-h-[60vh]"
        onClick={() => setActive(active === key ? null : key)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setActive(active === key ? null : key)
        }}
      >
        <div
          aria-hidden
          data-key={key}
          className="about-parallax absolute inset-0 will-change-transform transition-transform duration-500"
          style={{
            backgroundImage: `url('${img}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: 'translateY(0px) scale(1)',
          }}
        />

        <div className="relative z-10 bg-gradient-to-r from-black/40 to-transparent p-6 sm:p-10 text-white h-full">
          <h2 className="flex items-center gap-3 text-2xl font-semibold">
            <span>{emoji}</span>
            <span className="text-white/95">{key}</span>
          </h2>
          <div className="mt-4 max-w-4xl text-white/90">{isZh ? zh : en}</div>
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <LovePatternBg variant="navy">
          <div className="mx-auto max-w-[1120px] px-4 py-14 sm:px-8 sm:py-20">
            <p className="kicker text-yellow">{isZh ? '我們的項目' : 'Our Programmes'}</p>
            <h1 className="mt-3 max-w-3xl font-display text-[clamp(2rem,6vw,3.2rem)] leading-[1.04] font-semibold text-white">
              {isZh ? '關於我們' : "About Us"}
            </h1>
            <p className="section-lede mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              {isZh
                ? 'Love 21 Foundation 提供體育、營養及家庭為本的項目，幫助唐氏綜合症及自閉症人士發展。'
                : 'Love 21 Foundation provides sport, nutrition and family-centred programmes to help individuals with Down syndrome and autism thrive.'}
            </p>
          </div>
        </LovePatternBg>

        <BrandPatternBand variant="yellow" className="easy-hide" />

        <div className="mx-auto max-w-[1120px] px-4 py-12 sm:px-8 sm:py-16">
          <div className="space-y-12">
            {makeSection(
              isZh ? '運動' : 'Sports',
              '/brand/activity.jpg',
              '🏋️',
              <p>
                Our sports programme is designed without limitations. We aim to give our beneficiaries the greatest opportunity to reach their full potential by offering a comprehensive range of activities while also striving for excellence in each sport. In addition to sport classes, we also focus on strength training, coordination, and mental health activities.
              </p>,
              <p>
                我們的體育項目沒有限制。我們旨在為所有參與者提供最大的發展機會，通過提供全面的體育活動，並努力在每個項目中達到卓越水平。除了體育課程，我們還注重力量訓練、協調性和心理健康方面的活動。
              </p>,
            )}

            {makeSection(
              isZh ? '營養' : 'Nutrition',
              '/brand/class.jpg',
              '🥗',
              <p>
                Sport classes alone are not enough to significantly extend the life expectancy of our beneficiaries. This is why we’ve developed a well thought out nutrition programme to help our community, giving them the support and guidance they need to make significant healthy lifestyle changes. We also run regular cooking and food prep lessons to teach our families how to prepare these meals nutritiously and easily.
              </p>,
              <p>
                僅僅提供體育課程，並不能顯著地延長我們的受益人的壽命。因此，我們設計了一套全面的營養計劃，旨在幫助我們的社區，為他們提供必要的支持和指導，從而促使他們實現顯著的健康生活方式改變。我們還定期組織烹飪和食物準備課程，幫助我們的家庭以健康又簡單的方式來製作這些食物。
              </p>,
            )}

            {makeSection(
              isZh ? '家庭' : 'Family',
              '/brand/member.jpg',
              '👨‍👩‍👧‍👦',
              <p>
                Love 21’s focus on family sets us apart. Our parent beneficiaries play a huge role in our classes and out. Family support and care for their kids is uplifting and as a charity we do all we can to support them as well as their children. We offer specialty classes for parents only and also allow parental participation in a large number of our sport and healthy lifestyle classes.
              </p>,
              <p>
                Love 21 專注於家庭，這使我們與眾不同。我們的受益人（家長）在我們的課程和活動中發揮著重要作用。我們致力於為這些家庭提供支持和關懷，並盡力幫助他們和他們的孩子。我們提供專門為家長設計的課程，並且鼓勵家長參與我們的大部分體育和健康生活方式課程。
              </p>,
            )}

            {makeSection(
              isZh ? '企業社會責任' : 'CSR',
              '/brand/hero-huddle.jpg',
              '🤝',
              <p>
                Our Corporate Social Responsibility Programme is an extremely important one for Hong Kong. Reason being that our beneficiaries, the Down syndrome and autistic community, are rarely seen and often misunderstood. Your employees will not only learn about our beneficiary’s amazing ability in sport, but also about their greatest ability in bringing the best out of people.
              </p>,
              <p>
                我們的企業社會責任項目對香港至關重要。原因在於，我們的受益者，即患有唐氏綜合徵和自閉症的人群，往往不被關注，並且常常被誤解。您的員工不僅將瞭解我們受益人的非凡運動能力，更將瞭解他們激發他人潛力的卓越能力。
              </p>,
            )}

            <section className="rounded-2xl border border-navy/8 bg-paper p-6 sm:p-10 text-navy/85">
              <h3 className="text-xl font-semibold text-navy">{isZh ? '合作夥伴感言' : 'What Our Partners Say'}</h3>
              <div className="mt-4 space-y-6">
                <blockquote>
                  <strong>Chaim — Argyll Scott</strong>
                  <p className="mt-2 italic">
                    {isZh
                      ? '「與 Love 21 的合作非常順利。我們首先與傑夫和卡梅爾會面，他們向我們介紹了這個社區所面臨的挑戰，隨後，我們參與了一次健身課程，每個人都體驗了一個不同的健身站，旨在幫助社區成員通過簡單的運動保持活躍。這是一次非常難忘的經歷，我們很高興能為這樣一個有意義的組織提供幫助！」'
                      : '"Our experience with Love 21 has been amazing. We first met with Jeff and Carmel, who explained the challenges that this community face, before assisting in a circuit training lesson where each of us took a fitness station to help the community stay active through different simple exercises. It was an incredible experience and one that will stay with us for a long time, really happy to have helped an organisation with such a great cause!"'}
                  </p>
                </blockquote>

                <blockquote>
                  <strong>Laura — Nakama Global</strong>
                  <p className="mt-2 italic">
                    {isZh
                      ? '「在 Love 21 做志願者，對我們來說是一次非常有意義的經歷。我們遇到了很多友好的成員，並且體驗到了一個很棒的空間！我們非常喜歡這裡的各種活動，以及能夠參與到這樣一個精彩的社群中 ☺」'
                      : '"Volunteering at Love 21 was an eye-opening experience for us, with some delightful members and a cool space! We loved the different activities and a chance to be involved with such an amazing community ☺"'}
                  </p>
                </blockquote>
              </div>
            </section>

            <section className="rounded-2xl border border-navy/8 bg-paper p-6 sm:p-10 text-navy/85">
              <h3 className="text-xl font-semibold text-navy">{isZh ? '查詢企業合作' : 'CSR Inquiry'}</h3>
              <p className="mt-3">
                {isZh ? (
                  <>
                    如果您想了解更多關於我們獨特的企業社會責任（CSR）項目的信息，請聯繫我們的創始人/首席執行官：
                    <a className="underline" href="mailto:jeff@love21foundation.com">jeff@love21foundation.com</a>
                  </>
                ) : (
                  <>
                    If you’d like to learn more about our unique CSR Programme, please contact our Founder/CEO at{' '}
                    <a className="underline" href="mailto:jeff@love21foundation.com">jeff@love21foundation.com</a>
                  </>
                )}
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

export default AboutPage
