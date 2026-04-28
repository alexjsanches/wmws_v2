import { apiJson } from './apiClient'

/** Corpo enviado a POST /api/snk/gerencia-produtos/extrato (alinhado ao gateway Sankhya). */
export type GerenciaProdutosExtratoRequest = {
  codProd: number
  dtIni: string
  dtFin: string
  controle?: string
  codLocal?: string
  codEmp?: string
  codEmp2?: string
  periodoDias?: number
  visualizarSaldo?: boolean
  vlrNegPos?: boolean
  filtro?: Record<string, unknown>
}

export type GerenciaProdutosExtratoApiResponse = {
  sucesso?: boolean
  transactionId?: string
  responseBody?: {
    extratos?: {
      extrato?: ExtratoRawRow | ExtratoRawRow[]
    }
  }
}

/** Célula Sankhya costuma vir como `{ $: "valor" }` ou valor direto. */
export type ExtratoRawRow = Record<string, unknown>

export type ExtratoLinha = Record<string, string>

function unwrapCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object' && '$' in (value as object)) {
    const inner = (value as { $?: unknown }).$
    return inner === null || inner === undefined ? '' : String(inner)
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return String(value)
}

export function normalizarLinhaExtrato(row: ExtratoRawRow): ExtratoLinha {
  const out: ExtratoLinha = {}
  for (const [k, v] of Object.entries(row)) {
    out[k] = unwrapCell(v)
  }
  return out
}

function asExtratoArray(raw: ExtratoRawRow | ExtratoRawRow[] | undefined): ExtratoRawRow[] {
  if (raw === undefined) return []
  return Array.isArray(raw) ? raw : [raw]
}

export async function postGerenciaProdutosExtrato(
  body: GerenciaProdutosExtratoRequest,
): Promise<{ transactionId?: string; linhas: ExtratoLinha[] }> {
  const res = await apiJson<GerenciaProdutosExtratoApiResponse>('/api/snk/gerencia-produtos/extrato', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const rawList = asExtratoArray(res.responseBody?.extratos?.extrato)
  return {
    transactionId: res.transactionId,
    linhas: rawList.map(normalizarLinhaExtrato),
  }
}
