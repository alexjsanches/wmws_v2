import { apiJson } from './apiClient'

export type GetSuggestionRequest = {
  pk: string
  entityName?: string
  fieldName?: string
  showInactives?: boolean
  compacted?: boolean
  ignoreEntityCriteria?: boolean
  counter?: string | number
}

export type GetSuggestionResponse = {
  sucesso?: boolean
  transactionId?: string
  responseBody?: unknown
  suggestion?: Record<string, unknown>
}

export async function postGetSuggestion(body: GetSuggestionRequest): Promise<GetSuggestionResponse> {
  const entityName = body.entityName ?? 'Produto'
  const fieldName = body.fieldName ?? (entityName === 'LocalFinanceiro' ? 'CODLOCAL' : 'CODPROD')

  const payload: Record<string, unknown> = {
    pk: body.pk,
    entityName,
    showInactives: body.showInactives ?? true,
    compacted: body.compacted ?? false,
    ignoreEntityCriteria: body.ignoreEntityCriteria ?? false,
  }

  // Sankhya LocalFinanceiro: fieldName vai em options, não no critério raiz (senão PK não valida).
  if (entityName === 'LocalFinanceiro') {
    payload.options = { fieldName }
  } else {
    payload.fieldName = fieldName
  }

  if (body.counter !== undefined && body.counter !== '') {
    payload.counter = body.counter
  }

  return apiJson<GetSuggestionResponse>('/api/snk/pesquisa/get-suggestion', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined
}

/** Sankhya devolve `data` como array de linhas; às vezes vem um único objeto. */
function primeiraLinhaDeData(root: Record<string, unknown>): Record<string, unknown> | undefined {
  const d = root.data
  if (Array.isArray(d) && d.length > 0) {
    const first = d[0]
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      return first as Record<string, unknown>
    }
    return undefined
  }
  return asRecord(d)
}

function textoCampo(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return ''
}

/**
 * Extrai texto de descrição do objeto `suggestion` (ou bloco com `data`) devolvido pela API.
 */
export function extrairDescricaoSuggestion(
  suggestion: Record<string, unknown> | undefined,
  fieldName: string,
): string {
  if (!suggestion) return ''

  if (typeof suggestion.description === 'string' && suggestion.description.trim()) {
    return suggestion.description.trim()
  }

  const hint =
    typeof suggestion.descriptionField === 'string' ? suggestion.descriptionField.trim() : ''

  const tryRow = (row: Record<string, unknown> | undefined): string => {
    if (!row) return ''
    if (hint) {
      const h = textoCampo(row[hint])
      if (h) return h
      const shortHint = hint.includes('.') ? hint.split('.').pop() ?? hint : hint
      const h2 = textoCampo(row[shortHint])
      if (h2) return h2
    }
    const porCampo: Record<string, string> = {
      CODPROD: 'DESCRPROD',
      CODEMP: 'NOMEFANTASIA',
      CODLOCAL: 'DESCRLOCAL',
      CODPARC: 'RAZAOSOCIAL',
      NUNOTA: 'NOMEPARC',
    }
    const fallbacks = [
      porCampo[fieldName],
      'DESCRPROD',
      'DESCRLOCAL',
      'NOMEFANTASIA',
      'NOMEPARC',
      'RAZAOSOCIAL',
      'DESCRICAO',
      'DESCRICAOLOCAL',
    ].filter(Boolean) as string[]
    for (const k of fallbacks) {
      const t = textoCampo(row[k])
      if (t) return t
    }
    return ''
  }

  const direct = tryRow(suggestion)
  if (direct) return direct

  const linha = primeiraLinhaDeData(suggestion)
  if (linha) {
    const fromData = tryRow(linha)
    if (fromData) return fromData
  }

  return ''
}

/** Usa `suggestion`, depois `responseBody` (e `responseBody.json.$` se existir). */
export function extrairDescricaoDaResposta(res: GetSuggestionResponse, fieldName: string): string {
  let t = extrairDescricaoSuggestion(res.suggestion, fieldName)
  if (t) return t

  const body = asRecord(res.responseBody)
  if (body) {
    t = extrairDescricaoSuggestion(body, fieldName)
    if (t) return t

    const jsonWrap = asRecord(body.json)
    if (jsonWrap && typeof jsonWrap.$ === 'string') {
      try {
        const inner = JSON.parse(jsonWrap.$) as unknown
        const innerRec = asRecord(inner)
        if (innerRec) {
          t = extrairDescricaoSuggestion(innerRec, fieldName)
          if (t) return t
        }
      } catch {
        /* ignore */
      }
    }
  }

  return ''
}
