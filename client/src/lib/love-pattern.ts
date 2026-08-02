/**
 * Love 21 pattern colour presets.
 * Motifs are the mono-logo graffiti tile (`/brand/logo-pattern-cell.png`)
 * stamped in `brand-pattern.tsx`.
 */

export type LovePatternPreset = 'red' | 'navy' | 'yellow' | 'teal' | 'pink' | 'amber'

export const LOVE_PATTERN_PRESETS: Record<
  LovePatternPreset,
  { baseColor: string; patternColor: string; patternOpacity: number }
> = {
  // Soft graffiti ink on brand bases (ref: yellow on red)
  red: { baseColor: '#E4002B', patternColor: '#FFC72C', patternOpacity: 0.22 },
  navy: { baseColor: '#14284B', patternColor: '#FFFFFF', patternOpacity: 0.14 },
  yellow: { baseColor: '#FFC72C', patternColor: '#E4002B', patternOpacity: 0.16 },
  teal: { baseColor: '#00857D', patternColor: '#FFFFFF', patternOpacity: 0.16 },
  pink: { baseColor: '#F5A3B6', patternColor: '#E4002B', patternOpacity: 0.18 },
  amber: { baseColor: '#FFF3D1', patternColor: '#E4002B', patternOpacity: 0.12 },
}
