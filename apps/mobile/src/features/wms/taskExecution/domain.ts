import type { DivergenciaConcluirPayload, ItemTarefaWms } from '../../../types/wms'

function n(v: string | number | undefined | null): number {
  if (v === undefined || v === null || v === '') return 999999
  const x = Number(v)
  return Number.isFinite(x) ? x : 999999
}

function txt(v: string | number | undefined | null): string {
  return String(v ?? '').trim().toUpperCase()
}

export function ordenarRota(a: ItemTarefaWms, b: ItemTarefaWms): number {
  const steps = [
    n(a.local) - n(b.local),
    n(a.modulo) - n(b.modulo),
    n(a.rua) - n(b.rua),
    n(a.predio) - n(b.predio),
    n(a.nivel) - n(b.nivel),
    n(a.posicao) - n(b.posicao),
    txt(a.slot).localeCompare(txt(b.slot)),
    txt(a.pulmao).localeCompare(txt(b.pulmao)),
    a.nuitem - b.nuitem,
  ]
  return steps.find((x) => x !== 0) ?? 0
}

export function statusLabel(item: ItemTarefaWms): string {
  if (item.ok) return 'OK'
  if (item.divergencia) return 'Divergente'
  return 'Pendente'
}

export function buildDivergencias(itens: ItemTarefaWms[]): DivergenciaConcluirPayload[] {
  return itens
    .filter((i) => i.qtdrealizada !== undefined && Number(i.qtdrealizada) !== Number(i.qtdprevista))
    .map((i) => ({
      nuitem: i.nuitem,
      tipo: Number(i.qtdrealizada) < Number(i.qtdprevista) ? 'F' : 'S',
      qtdprevista: Number(i.qtdprevista),
      qtdencontrada: Number(i.qtdrealizada ?? 0),
    }))
}

export function parseOptionalNumber(v: string): number | undefined {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : undefined
}

export function buildProgresso(itens: ItemTarefaWms[]) {
  const ok = itens.filter((i) => i.ok).length
  const diverg = itens.filter((i) => i.divergencia).length
  const pend = itens.length - ok - diverg
  return { total: itens.length, ok, diverg, pend }
}
