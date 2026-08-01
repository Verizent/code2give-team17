import { useSite } from '@/components/site-provider'
import { cn } from '@/lib/utils'

export function DemoBanner({ className }: { className?: string }) {
  const { t } = useSite()

  return (
    <div
      className={cn(
        'border-y border-yellow/70 bg-yellow/25 px-4 py-2 text-center text-xs font-semibold text-navy',
        className,
      )}
      role="status"
    >
      {t.give.demoBanner}
    </div>
  )
}
