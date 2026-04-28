import { apiJson } from './apiClient'
import type {
  CorteConferenciaPayload,
  Divergencia,
  DivergenciaConcluirPayload,
  FechamentoConferenciaPayload,
  ItemArmazenagem,
  ItemNota,
  ItemTarefaWms,
  OrdemWmsCab,
  SeparacaoTarefaResumo,
  TarefaResumo,
  TarefaAtribuicao,
  TarefaWmsLista,
  WmsConfigMeResponse,
  VolumeConferencia,
  VolumeConferenciaItem,
  VolumeConferenciaResumo,
} from '../types/wms'

const W = '/api/wms'

function asText(v: unknown): string {
  if (typeof v === 'string' || typeof v === 'number') return String(v)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (typeof o.nome === 'string' && o.nome.trim()) return o.nome
    if (typeof o.descricao === 'string' && o.descricao.trim()) return o.descricao
  }
  return ''
}

function normalizeResumo<T extends { parceiro?: unknown; nomeemp?: unknown }>(item: T): T {
  return {
    ...item,
    parceiro: asText(item.parceiro),
    nomeemp: asText(item.nomeemp),
  }
}

function unwrapArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) {
    return raw as T[]
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    for (const key of ['data', 'items', 'result', 'rows', 'tarefas', 'notas']) {
      const v = o[key]
      if (Array.isArray(v)) {
        return v as T[]
      }
    }
  }
  return []
}

async function wmsGetArray<T>(path: string): Promise<T[]> {
  const raw = await apiJson<unknown>(path)
  return unwrapArray<T>(raw)
}

/** GET /api/wms/recebimento/notas-pendentes */
export function getRecebimentoNotasPendentes() {
  return wmsGetArray<TarefaResumo>(`${W}/recebimento/notas-pendentes`).then((list) => list.map(normalizeResumo))
}

/** GET /api/wms/recebimento/nota/:nunota/itens */
export function getRecebimentoNotaItens(nunota: number) {
  return wmsGetArray<ItemNota>(`${W}/recebimento/nota/${nunota}/itens`)
}

/** POST /api/wms/recebimento/tarefa — codemp opcional (resolvido no backend pela TGFCAB). */
export function postRecebimentoTarefa(body: { nunota: number; codemp?: number }) {
  return apiJson<{ nutarefa: number; codemp: number; existente?: boolean }>(`${W}/recebimento/tarefa`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** PUT /api/wms/recebimento/tarefa/:nutarefa/item/:nuitem (backend Fastify) */
export function patchRecebimentoItem(
  nutarefa: number,
  nuitem: number,
  body: { qtdrealizada: number; controle?: string },
) {
  return apiJson<{ ok: boolean }>(`${W}/recebimento/tarefa/${nutarefa}/item/${nuitem}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** POST /api/wms/recebimento/tarefa/:nutarefa/concluir */
export function postRecebimentoConcluir(nutarefa: number, body?: { divergencias?: Divergencia[] }) {
  return apiJson<{ nutarefa_arm: number }>(`${W}/recebimento/tarefa/${nutarefa}/concluir`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  })
}

/** GET /api/wms/armazenagem/tarefas-pendentes */
export function getArmazenagemTarefasPendentes() {
  return wmsGetArray<TarefaResumo>(`${W}/armazenagem/tarefas-pendentes`).then((list) => list.map(normalizeResumo))
}

/** GET /api/wms/armazenagem/tarefa/:nutarefa/itens */
export function getArmazenagemTarefaItens(nutarefa: number) {
  return wmsGetArray<ItemArmazenagem>(`${W}/armazenagem/tarefa/${nutarefa}/itens`)
}

/** PUT /api/wms/armazenagem/tarefa/:nutarefa/item/:nuitem */
export function patchArmazenagemItem(
  nutarefa: number,
  nuitem: number,
  body: { codlocal_dest?: number; local_livre?: string; qtdrealizada: number },
) {
  return apiJson<{ ok: boolean }>(`${W}/armazenagem/tarefa/${nutarefa}/item/${nuitem}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** POST /api/wms/armazenagem/tarefa/:nutarefa/concluir */
export function postArmazenagemConcluir(nutarefa: number) {
  return apiJson<{ ok: boolean }>(`${W}/armazenagem/tarefa/${nutarefa}/concluir`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

// ── Separação (/api/wms/separacao) ─────────────────────────────────────────

export function getSeparacaoOrdensPendentes() {
  return wmsGetArray<OrdemWmsCab>(`${W}/separacao/ordens-pendentes`).then((list) => list.map(normalizeResumo))
}

export function getSeparacaoItensOrdem(nunota: number) {
  return wmsGetArray<ItemTarefaWms>(`${W}/separacao/ordem/${nunota}/itens`)
}

export function postSeparacaoTarefa(body: { nunota: number; codemp: number }) {
  return apiJson<{ nutarefa: number; codonda?: number; existente?: boolean }>(`${W}/separacao/tarefa`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getSeparacaoTarefasPendentes() {
  return wmsGetArray<TarefaWmsLista>(`${W}/separacao/tarefas-pendentes`).then((list) => list.map(normalizeResumo))
}

export function getSeparacaoTarefaItens(nutarefa: number) {
  return wmsGetArray<ItemTarefaWms>(`${W}/separacao/tarefa/${nutarefa}/itens`)
}

export function getSeparacaoTarefaResumo(nutarefa: number) {
  return apiJson<SeparacaoTarefaResumo>(`${W}/separacao/tarefa/${nutarefa}/resumo`).then((r) => ({
    ...r,
    parceiro: asText(r.parceiro),
    empresa: asText(r.empresa),
    transportador: asText(r.transportador),
  }))
}

export function patchSeparacaoItem(
  nutarefa: number,
  nuitem: number,
  body: { qtdrealizada: number; controle?: string },
) {
  return apiJson<{ ok: boolean }>(`${W}/separacao/tarefa/${nutarefa}/item/${nuitem}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function postSeparacaoConcluir(
  nutarefa: number,
  body?: { divergencias?: DivergenciaConcluirPayload[]; enderecoArea?: string },
) {
  return apiJson<{ ok: boolean; nunota?: number }>(`${W}/separacao/tarefa/${nutarefa}/concluir`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  })
}

// ── Conferência (/api/wms/conferencia) ───────────────────────────────────────

export function getConferenciaPedidosPendentes() {
  return wmsGetArray<OrdemWmsCab>(`${W}/conferencia/pedidos-pendentes`).then((list) => list.map(normalizeResumo))
}

export function getConferenciaItensPedido(nunota: number) {
  return wmsGetArray<ItemTarefaWms>(`${W}/conferencia/pedido/${nunota}/itens`)
}

export function postConferenciaTarefa(body: { nunota: number; codemp: number }) {
  return apiJson<{ nutarefa: number; codonda?: number; existente?: boolean }>(`${W}/conferencia/tarefa`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getConferenciaTarefasPendentes() {
  return wmsGetArray<TarefaWmsLista>(`${W}/conferencia/tarefas-pendentes`).then((list) => list.map(normalizeResumo))
}

export function getConferenciaTarefaItens(nutarefa: number) {
  return wmsGetArray<ItemTarefaWms>(`${W}/conferencia/tarefa/${nutarefa}/itens`)
}

export function patchConferenciaItem(
  nutarefa: number,
  nuitem: number,
  body: { qtdrealizada: number; controle?: string },
) {
  return apiJson<{ ok: boolean }>(`${W}/conferencia/tarefa/${nutarefa}/item/${nuitem}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function postConferenciaConcluir(
  nutarefa: number,
  body?: {
    divergencias?: DivergenciaConcluirPayload[]
    enderecoExpedicao?: string
    cortes?: CorteConferenciaPayload[]
    fechamento?: FechamentoConferenciaPayload
  },
) {
  return apiJson<{ ok: boolean; nunota?: number }>(`${W}/conferencia/tarefa/${nutarefa}/concluir`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  })
}

// ── Conferência por volumes ───────────────────────────────────────────────────

export function getConferenciaVolumes(nutarefa: number) {
  return wmsGetArray<VolumeConferencia>(`${W}/conferencia/tarefa/${nutarefa}/volumes`)
}

export function getConferenciaVolumesResumo(nutarefa: number) {
  return apiJson<VolumeConferenciaResumo>(`${W}/conferencia/tarefa/${nutarefa}/volumes/resumo`)
}

export function postConferenciaVolumeAbrir(nutarefa: number, body?: { obs?: string }) {
  return apiJson<{ nuconf: number; seqvol: number; ordem?: number; status: 'A'; existente?: boolean }>(
    `${W}/conferencia/tarefa/${nutarefa}/volumes/abrir`,
    { method: 'POST', body: JSON.stringify(body ?? {}) },
  )
}

export function postConferenciaVolumeFechar(
  nutarefa: number,
  seqvol: number,
  body?: { peso?: number; altura?: number; largura?: number; profundidade?: number; obs?: string },
) {
  return apiJson<{ ok: boolean; nuconf: number; seqvol: number; status: 'F' }>(
    `${W}/conferencia/tarefa/${nutarefa}/volumes/${seqvol}/fechar`,
    { method: 'POST', body: JSON.stringify(body ?? {}) },
  )
}

export function getConferenciaVolumeItens(nutarefa: number, seqvol: number) {
  return wmsGetArray<VolumeConferenciaItem>(`${W}/conferencia/tarefa/${nutarefa}/volumes/${seqvol}/itens`)
}

export function postConferenciaVolumeItemAdicionar(
  nutarefa: number,
  seqvol: number,
  body: { nuitem: number; codprod: number; qtd: number; controle?: string; codvol?: string; codbarra?: string },
) {
  return apiJson<{ ok: true; nuconf: number; seqvol: number; seqitem: number }>(
    `${W}/conferencia/tarefa/${nutarefa}/volumes/${seqvol}/itens/adicionar`,
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export function postConferenciaVolumeItemRemover(nutarefa: number, seqvol: number, body: { seqitem: number }) {
  return apiJson<{ ok: true }>(`${W}/conferencia/tarefa/${nutarefa}/volumes/${seqvol}/itens/remover`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ── Configurações WMS por usuário ─────────────────────────────────────────────

export function getWmsConfigMe(codemp: number) {
  return apiJson<WmsConfigMeResponse>(`${W}/config/me?codemp=${encodeURIComponent(String(codemp))}`)
}

export function putWmsConfigMe(body: { codemp: number; values: Record<string, unknown> }) {
  return apiJson<{ ok: boolean; values?: Record<string, unknown> }>(`${W}/config/me`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

// ── Atribuição de tarefas WMS ─────────────────────────────────────────────────

export function getWmsTarefaAtribuicao(nutarefa: number) {
  return apiJson<TarefaAtribuicao>(`${W}/tarefa/${nutarefa}/atribuicao`)
}

export function postWmsTarefaAtribuir(nutarefa: number, body: { codusu: number }) {
  return apiJson<{ ok: true; nutarefa: number; codusuAtrib: number }>(`${W}/tarefa/${nutarefa}/atribuir`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function postWmsTarefaDesatribuir(nutarefa: number) {
  return apiJson<{ ok: true; nutarefa: number; codusuAtrib: 0 }>(`${W}/tarefa/${nutarefa}/desatribuir`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

// ── Consulta produto WMS (GET /api/wms/produtos/:codprod/consulta) ───────────

export type ConsultaProdutoWmsResposta = {
  produto: {
    codprod: number
    descricao: string
    marca: string
    refforn: string
    codvol: string
    ad_st: string
  }
  estoque: Array<{
    codemp: number
    codlocal: number
    controle: string | null
    estoque: number
    reservado: number
    disponivel: number
  }>
  reservas: Array<{
    nunota: number
    codemp: number
    qtd: number
    codtipoper: number | null
    descricaoTop: string
    tipmov: string | null
  }>
  entradasPendentes: Array<{
    qtd: number
    codtipoper: number | null
    descricaoTop: string
    nunota: number | null
  }>
}

export function getWmsProdutoConsulta(codprod: number) {
  return apiJson<ConsultaProdutoWmsResposta>(`${W}/produtos/${encodeURIComponent(String(codprod))}/consulta`)
}
