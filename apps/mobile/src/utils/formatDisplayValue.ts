export function formatDisplayValue(v: unknown): string {
  if (typeof v === 'string' || typeof v === 'number') return String(v)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (typeof o.nome === 'string' && o.nome.trim()) return o.nome
    if (typeof o.descricao === 'string' && o.descricao.trim()) return o.descricao
  }
  return '—'
}
