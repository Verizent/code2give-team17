import { cn } from '@/lib/utils'

/** Site logo — `/brand/logo.png` (user asset; do not edit the file). */
export function BrandLogo({
  className,
  markClassName,
}: {
  className?: string
  markClassName?: string
  /** @deprecated ignored */
  variant?: 'full' | 'mark'
  /** @deprecated ignored */
  showWord?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      <img
        src="/brand/logo.png?v=user-asset"
        alt="Love 21"
        className={cn('h-8 w-auto sm:h-10', markClassName)}
      />
    </span>
  )
}
