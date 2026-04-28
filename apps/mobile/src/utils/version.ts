function toInt(v: string): number {
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? 0 : n
}

function normalize(version: string): [number, number, number] {
  const parts = version.trim().split('.')
  return [toInt(parts[0] ?? '0'), toInt(parts[1] ?? '0'), toInt(parts[2] ?? '0')]
}

/**
 * Compara versões no formato semver simples `x.y.z`.
 * Retorna:
 * - 1 se `a` > `b`
 * - 0 se iguais
 * - -1 se `a` < `b`
 */
export function compareVersion(a: string, b: string): -1 | 0 | 1 {
  const [a1, a2, a3] = normalize(a)
  const [b1, b2, b3] = normalize(b)
  if (a1 !== b1) return a1 > b1 ? 1 : -1
  if (a2 !== b2) return a2 > b2 ? 1 : -1
  if (a3 !== b3) return a3 > b3 ? 1 : -1
  return 0
}
