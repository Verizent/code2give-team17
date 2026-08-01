import { useSite } from '@/components/site-provider'
import type { MeProofReceipt } from '@/features/me/impact'

/**
 * Proof receipts — Overview-only: when a funded session actually ran.
 * Aggregated and de-identified; never a named individual.
 * Empty until allocation→session fan-out (or a gift with a real session title) exists.
 */
export function ProofReceipts({ receipts }: { receipts: MeProofReceipt[] }) {
  const { t } = useSite()
  const m = t.me

  return (
    <section aria-labelledby="proof-receipts-title" className="mt-14">
      <p className="kicker text-red">{m.receiptsKicker}</p>
      <h2
        id="proof-receipts-title"
        className="mt-2 font-display text-3xl font-semibold text-navy"
      >
        {m.receiptsTitle}
      </h2>
      <p className="mt-3 max-w-2xl text-navy/70">{m.receiptsBody}</p>

      {receipts.length === 0 ? (
        <p className="mt-8 text-navy/55">{m.receiptsEmpty}</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {receipts.map((receipt) => (
            <li
              key={receipt.id}
              className="border-l-4 border-teal bg-gradient-to-r from-teal/5 to-transparent py-4 pl-5 pr-4"
            >
              <p className="font-display text-xl font-semibold text-navy sm:text-2xl">
                {receipt.headline}
              </p>
              <p className="mt-2 text-navy/75">{receipt.detail}</p>
              <p className="mt-3 text-sm text-navy/45">
                {new Date(receipt.happened_at).toLocaleDateString()}
                {' · '}
                {m.receiptsDeidentified}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
