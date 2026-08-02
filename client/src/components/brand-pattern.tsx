import type { CSSProperties, ReactNode } from 'react'
import {
  LOVE_PATTERN_PRESETS,
  type LovePatternPreset,
} from '@/lib/love-pattern'
import { cn } from '@/lib/utils'

/**
 * Dense overlapping mono-logo graffiti tile (square).
 * Soft ink via CSS opacity — packed, not scattered.
 */
const LOGO_CELL = '/brand/logo-pattern-cell.png'

type BandProps = {
  variant?: LovePatternPreset
  className?: string
  /** Width/height of one pattern tile */
  tileSize?: number
}

function patternLayerStyle(
  patternColor: string,
  patternOpacity: number,
  tileSize: number,
): CSSProperties {
  return {
    backgroundColor: patternColor,
    opacity: patternOpacity,
    WebkitMaskImage: `url(${LOGO_CELL})`,
    WebkitMaskSize: `${tileSize}px ${tileSize}px`,
    WebkitMaskRepeat: 'repeat',
    WebkitMaskPosition: '0 0',
    maskImage: `url(${LOGO_CELL})`,
    maskSize: `${tileSize}px ${tileSize}px`,
    maskRepeat: 'repeat',
    maskPosition: '0 0',
  }
}

/**
 * Repeating mono-logo band — base colour + one-colour logo stamps.
 * Hidden in Easy Read via `.brand-pattern-band`.
 */
export function BrandPatternBand({
  variant = 'red',
  className = '',
  tileSize = 200,
}: BandProps) {
  const { baseColor, patternColor, patternOpacity } = LOVE_PATTERN_PRESETS[variant]

  return (
    <div
      aria-hidden="true"
      className={cn('brand-pattern-band relative h-16 overflow-hidden sm:h-20', className)}
      style={{ backgroundColor: baseColor }}
    >
      <div
        className="absolute inset-0"
        style={patternLayerStyle(patternColor, patternOpacity, tileSize)}
      />
    </div>
  )
}

/**
 * Full-bleed bold pattern background for a section / hero panel.
 * Pattern layer hides in Easy Read; solid colour + children stay.
 */
export function LovePatternBg({
  variant = 'red',
  className = '',
  tileSize = 240,
  children,
}: BandProps & { children?: ReactNode }) {
  const { baseColor, patternColor, patternOpacity } = LOVE_PATTERN_PRESETS[variant]

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ backgroundColor: baseColor }}
    >
      <div
        aria-hidden="true"
        className="brand-pattern-band easy-hide pointer-events-none absolute inset-0"
        style={patternLayerStyle(patternColor, patternOpacity, tileSize)}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
