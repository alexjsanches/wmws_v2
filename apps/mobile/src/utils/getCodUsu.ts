import type { ProfileResponse } from '../types/api'

/** CODUSU do perfil Sankhya (para log AD_TWSLOGEND). */
export function getCodUsu(user: ProfileResponse | null): number | null {
  if (!user) return null
  const o = user as Record<string, unknown>
  const v = o.codusu ?? o.CODUSU ?? o.codUsu
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseInt(v, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}
