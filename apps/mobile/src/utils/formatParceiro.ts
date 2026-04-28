export function formatParceiro(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    const nome = o.nome
    if (typeof nome === 'string' && nome.trim()) return nome
  }
  return '—'
}
