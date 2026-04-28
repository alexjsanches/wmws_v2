import type { ProfileResponse } from '../types/api'

export function extractCodusu(profile: ProfileResponse | null): number | undefined {
  if (!profile) return undefined
  const o = profile as Record<string, unknown>
  const c = o.codusu ?? o.CODUSU
  if (typeof c === 'number' && Number.isFinite(c)) return c
  if (typeof c === 'string') {
    const n = parseInt(c, 10)
    if (!Number.isNaN(n)) return n
  }
  return undefined
}
