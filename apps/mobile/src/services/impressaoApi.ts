import { apiJson } from './apiClient'

const P = '/api/jobs-impressao'

export const AGENTE_ID_IMPRESSAO = 'PC-ARMAZEM-01'
export const IMPRESSORA_LOGICO = 'zebra-armazem'

// ── Tipos ────────────────────────────────────────────────────────────────────

export type ParametroEntrada = {
  nome: string
  tipo: 'number' | 'string'
  obrigatorio: boolean
  descricao: string
  exemplo?: string | number
}

export type TemplateInfo = {
  id: string
  nome: string
  descricao: string
  parametrosEntrada: ParametroEntrada[]
}

export type ImprimirBody = {
  template: string
  parametros: Record<string, unknown>
  impressora?: string
  prioridade?: string
  agenteId?: string
  quantidade?: number
}

export type ImprimirResponse = {
  success?: boolean
  message?: string
  total?: number
  jobs?: unknown[]
  erro?: string
  detalhe?: string
  templatesDisponiveis?: string[]
}

// ── Endpoints ────────────────────────────────────────────────────────────────

/** Lista templates disponíveis com os parâmetros que cada um espera. */
export function getTemplates() {
  return apiJson<{ success: boolean; templates: TemplateInfo[] }>(`${P}/templates`)
}

/** Enfileira um job de impressão pelo nome do template e seus parâmetros de entrada. */
export function postImprimir(body: ImprimirBody) {
  return apiJson<ImprimirResponse>(`${P}/imprimir`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
