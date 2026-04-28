import { apiFetch, apiJson } from './apiClient'
import type {
  ArmPolicyConfig,
  EnderecoProdutoResponse,
  EstoqueEnderecadoRequest,
  EstoqueEnderecadoResponse,
  HistoricoEnderecoProduto,
  PendenciasMovimentacaoRequest,
  PendenciasMovimentacaoResponse,
  ProdutoEndereco,
  RegistrarMovimentacaoBlocked,
  RegistrarMovimentacaoNeedConfirm,
  RegistrarMovimentacaoRequest,
  RegistrarMovimentacaoSuccess,
  ResumoValidadeQuery,
  ResumoValidadeResponse,
} from '../types/movimentacaoProativa'

const M = '/api/wms/movimentacao-proativa'

function cell(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (k in row && row[k] != null && row[k] !== '') return row[k]
  }
  return undefined
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

function str(v: unknown): string {
  return v == null ? '' : String(v)
}

function parseHistoricoDate(v: unknown): Date | null {
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? null : v
  }
  const raw = String(v ?? '').trim()
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

export function normalizeProdutoRow(row: Record<string, unknown>, fallbackEnderecoAtual = ''): ProdutoEndereco {
  return {
    codprod: num(cell(row, 'CODPROD', 'codprod')),
    descrprod: str(cell(row, 'DESCRPROD', 'descrprod')),
    marca: str(cell(row, 'MARCA', 'marca')),
    refforn: str(cell(row, 'REFFORN', 'refforn')),
    referencia: str(cell(row, 'REFERENCIA', 'referencia')),
    enderecoAtual: str(cell(row, 'ENDERECO_ATUAL', 'endereco_atual')) || fallbackEnderecoAtual,
    enderecoCadastro: str(cell(row, 'ENDERECO_CADASTRO', 'endereco_cadastro')),
    qtdestoque: num(cell(row, 'QTDESTOQUE', 'qtdestoque')),
    codvol: str(cell(row, 'CODVOL', 'codvol')),
    controle: str(cell(row, 'CONTROLE', 'controle')),
  }
}

function assertSuccess(res: { success?: boolean; message?: string }, fallback: string) {
  if (res && typeof res === 'object' && res.success === false) {
    throw new Error(res.message || fallback)
  }
}

/** POST …/produtos-por-endereco */
export async function postMpProdutosPorEndereco(body: {
  endereco: string
  codemp?: number
  codlocal?: number
}): Promise<ProdutoEndereco[]> {
  const res = await apiJson<{ success: boolean; data?: unknown[]; message?: string }>(`${M}/produtos-por-endereco`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  assertSuccess(res, 'Erro ao buscar produtos por endereço')
  const rows = Array.isArray(res.data) ? res.data : []
  return rows.map((r) => normalizeProdutoRow(r as Record<string, unknown>, body.endereco))
}

/** POST …/produto-por-codigo (CODPROD numérico) */
export async function postMpProdutoPorCodigo(body: { codigo: string; codemp?: number }): Promise<ProdutoEndereco | null> {
  const res = await apiJson<{ success: boolean; data?: unknown; message?: string }>(`${M}/produto-por-codigo`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  assertSuccess(res, 'Erro ao buscar produto')
  if (res.data == null || typeof res.data !== 'object') return null
  return normalizeProdutoRow(res.data as Record<string, unknown>)
}

/** POST …/produto-por-codigo-barras */
export async function postMpProdutoPorCodigoBarras(body: {
  codigoBarras: string
  codemp?: number
}): Promise<ProdutoEndereco | null> {
  const res = await apiJson<{ success: boolean; data?: unknown; message?: string }>(`${M}/produto-por-codigo-barras`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  assertSuccess(res, 'Erro ao buscar produto por código de barras')
  if (res.data == null || typeof res.data !== 'object') return null
  return normalizeProdutoRow(res.data as Record<string, unknown>)
}

/** POST …/endereco-produto */
export async function postMpEnderecoProduto(body: {
  codprod: number
  codemp?: number
}): Promise<EnderecoProdutoResponse | null> {
  const res = await apiJson<{
    success: boolean
    data?: EnderecoProdutoResponse | null
    message?: string
  }>(`${M}/endereco-produto`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (res.success === false) return null
  if (!res.data || typeof res.data !== 'object') return null
  const d = res.data as EnderecoProdutoResponse
  const pr = d.produto as Record<string, unknown>
  return {
    enderecoCadastro: d.enderecoCadastro,
    produto: normalizeProdutoRow(pr),
  }
}

/** PUT …/endereco-cadastro-produto */
export async function putMpEnderecoCadastroProduto(body: {
  codprod: number
  modulo: number
  rua: number
  predio: number
  nivel: number
}): Promise<void> {
  const res = await apiJson<{ success: boolean; message?: string }>(`${M}/endereco-cadastro-produto`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  assertSuccess(res, 'Erro ao atualizar endereço do produto')
}

/** POST …/log-movimentacao */
export async function postMpLogMovimentacao(body: {
  codusu: number
  endlido: string
  endcadastro: string
  acao: string
  codprod: number
  controle?: string
  desaparecido?: string
}): Promise<void> {
  const res = await apiJson<{ success: boolean; message?: string }>(`${M}/log-movimentacao`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  assertSuccess(res, 'Erro ao registrar log')
}

/** GET …/verificar-desaparecimento?codprod= */
export async function getMpVerificarDesaparecimento(codprod: number): Promise<{ desaparecido: boolean }> {
  const res = await apiJson<{ success: boolean; data?: { desaparecido?: boolean }; message?: string }>(
    `${M}/verificar-desaparecimento?codprod=${encodeURIComponent(String(codprod))}`,
  )
  assertSuccess(res, 'Erro ao verificar desaparecimento')
  return { desaparecido: res.data?.desaparecido === true }
}

/** POST …/historico-enderecos */
export async function postMpHistoricoEnderecos(body: {
  codprod: number
  codemp: number
}): Promise<HistoricoEnderecoProduto[]> {
  const res = await apiJson<{
    success: boolean
    data?: HistoricoEnderecoProduto[]
    message?: string
  }>(`${M}/historico-enderecos`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  assertSuccess(res, 'Erro ao buscar histórico')
  const list = Array.isArray(res.data) ? res.data : []
  return list.map((h) => ({
    ...h,
    dataAlteracao: parseHistoricoDate((h as Record<string, unknown>).dataAlteracao),
    dataAlteracaoRaw: String((h as Record<string, unknown>).dataAlteracaoRaw ?? ''),
  }))
}

/** POST …/registrar-movimentacao (com política de armazenagem) */
export async function postMpRegistrarMovimentacao(
  body: RegistrarMovimentacaoRequest,
): Promise<RegistrarMovimentacaoSuccess | RegistrarMovimentacaoBlocked | RegistrarMovimentacaoNeedConfirm> {
  const res = await apiFetch(`${M}/registrar-movimentacao`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data: unknown = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = {}
  }
  const raw = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  const policyRaw = (raw.policy && typeof raw.policy === 'object' ? raw.policy : {}) as Record<string, unknown>
  const normalizedPolicy = {
    ok: policyRaw.ok === true,
    warnings: Array.isArray(policyRaw.warnings) ? policyRaw.warnings.map((w) => String(w)) : [],
    errors: Array.isArray(policyRaw.errors) ? policyRaw.errors.map((e) => String(e)) : [],
    effectiveConfig: (policyRaw.effectiveConfig ?? {}) as ArmPolicyConfig | Record<string, unknown>,
  }
  const normalized = {
    success: raw.success === true,
    message: String(raw.message ?? ''),
    requireConfirmation: raw.requireConfirmation === true,
    policy: normalizedPolicy,
  }
  if (res.status === 409 && normalized.requireConfirmation) {
    return normalized as RegistrarMovimentacaoNeedConfirm
  }
  if (res.status === 400) {
    return normalized as RegistrarMovimentacaoBlocked
  }
  if (!res.ok) {
    throw new Error(normalized.message || 'Erro ao registrar movimentação.')
  }
  return normalized as RegistrarMovimentacaoSuccess
}

/** POST …/estoque-enderecado */
export async function postMpEstoqueEnderecado(body: EstoqueEnderecadoRequest): Promise<EstoqueEnderecadoResponse> {
  const res = await apiJson<EstoqueEnderecadoResponse>(`${M}/estoque-enderecado`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  assertSuccess(res, 'Erro ao buscar estoque enderecado')
  return {
    success: res.success !== false,
    data: Array.isArray(res.data) ? res.data : [],
    message: res.message,
  }
}

/** POST …/pendencias-movimentacao */
export async function postMpPendenciasMovimentacao(
  body: PendenciasMovimentacaoRequest,
): Promise<PendenciasMovimentacaoResponse> {
  const res = await apiJson<PendenciasMovimentacaoResponse>(`${M}/pendencias-movimentacao`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  assertSuccess(res, 'Erro ao buscar pendencias de movimentacao')
  return {
    success: res.success !== false,
    data: Array.isArray(res.data) ? res.data : [],
    message: res.message,
  }
}

/** GET …/resumo-validade */
export async function getMpResumoValidade(params: ResumoValidadeQuery): Promise<ResumoValidadeResponse> {
  const query = new URLSearchParams()
  if (params.codemp != null) query.set('codemp', String(params.codemp))
  if (params.codlocal != null) query.set('codlocal', String(params.codlocal))
  if (params.codprod != null) query.set('codprod', String(params.codprod))
  if (params.diasAlerta != null) query.set('diasAlerta', String(params.diasAlerta))
  const suffix = query.toString()
  const path = `${M}/resumo-validade${suffix ? `?${suffix}` : ''}`
  const res = await apiJson<ResumoValidadeResponse>(path)
  assertSuccess(res, 'Erro ao buscar resumo de validade')
  return {
    success: res.success !== false,
    data: res.data ?? { qtdVencido: 0, qtdProxVenc: 0, qtdEstoque: 0, diasAlerta: params.diasAlerta ?? 30 },
    message: res.message,
  }
}
