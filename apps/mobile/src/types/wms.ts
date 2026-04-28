/** Contratos alinhados a `instrucoes.md` (prefixo `/api/wms`). */

export type TipoTarefa = 'REC' | 'ARM' | 'SEP' | 'CON'
export type StatusTarefa = 'P' | 'A' | 'C' | 'D'
export type StatusItem = 'P' | 'C' | 'D' | 'N'
export type TipoDivergencia = 'F' | 'S' | 'E'
export type ResolucaoDivergencia = 'P' | 'C' | 'R' | 'A'

export interface TarefaResumo {
  nutarefa: number
  tipo: TipoTarefa
  nunota: number
  numnota: string
  codemp: number
  nomeemp: string
  parceiro: string
  status: StatusTarefa
  dthcriacao: string
  total_itens: number
  itens_pendentes: number
}

export interface ItemNota {
  nuitem: number
  codprod: number
  descrprod: string
  marca: string
  referencia: string
  ca: string
  codbarra: string
  codvol: string
  qtdprevista: number
  qtdrealizada?: number
  controle?: string
  status: StatusItem
}

export interface ItemSeparacao extends ItemNota {
  modulo: string
  rua: string
  predio: string
  nivel: string
  posicao: string
  estdisp: number
}

export interface ItemArmazenagem extends ItemNota {
  cross_docking: boolean
  codlocal_dest?: number
  local_livre?: string
}

export interface Divergencia {
  nuitem: number
  codprod: number
  tipo: TipoDivergencia
  qtdprevista: number
  qtdencontrada: number
  resolucao: ResolucaoDivergencia
  obsresolucao?: string
}

/** Pedido/ordem ainda sem tarefa SEP ou CON (resposta das rotas *-pendentes). */
export type OrdemWmsCab = {
  nunota: number
  numnota: string
  codemp: number
  nomeemp: string
  parceiro: string
  statusnota: string
  pendente: string
}

/** Tarefa SEP/CON em aberto (lista `tarefas-pendentes`). */
export type TarefaWmsLista = {
  nutarefa: number
  codonda?: number
  nunota: number
  numnota: string
  codemp: number
  parceiro: string
  status: StatusTarefa
  codusuAtrib: number
  dthatrib?: string
  codusuGer: number
  totalItens: number
  itensPendentes: number
  dthcriacao: string
}

export type TarefaAtribuicao = {
  nutarefa: number
  codusuAtrib: number
  dthatrib?: string
  codusuGer: number
}

/** Item da tarefa ou pré-visualização da ordem (separação / conferência). */
export type ItemTarefaWms = {
  nuitem: number
  codprod: number
  descrprod: string
  marca?: string
  referencia?: string
  ca?: string
  codbarra?: string
  ad_st?: string
  codvol: string
  qtdprevista: number
  qtdrealizada?: number
  controle?: string
  local?: string
  modulo?: string
  rua?: string
  predio?: string
  nivel?: string
  posicao?: string
  slot?: string
  pulmao?: string
  estdisp?: number
  ok?: boolean
  divergencia?: boolean
  status: string
}

export type SeparacaoTarefaResumo = {
  nota: {
    nunota: number
    numnota: string
    dtneg?: string
    codemp: number
  }
  empresa?: string
  parceiro?: string
  vendedor?: string
  frete?: string
  transportador?: string
  top?: {
    codtipoper?: number
    descricao?: string
  }
  tipoNegociacao?: {
    codtipvenda?: number
    descricao?: string
  }
  ordemcarga?: number
  statusAguardando?: string
  observacoes?: {
    observacao?: string
    obsInterno?: string
  }
  totais?: {
    itens: number
    pendentes: number
    conferidos: number
    divergentes: number
  }
}

/** Corpo de divergência ao concluir SEP/CON (alinhado ao backend `AD_WMSDIVERG`). */
export type DivergenciaConcluirPayload = {
  nuitem: number
  tipo: 'F' | 'S' | 'E'
  qtdprevista: number
  qtdencontrada: number
  motivo?: string
  subtipo?: string
  obsresolucao?: string
}

export type CorteConferenciaPayload = {
  nuitem: number
  qtdcorte: number
  motivo?: string
}

export type FechamentoConferenciaPayload = {
  pesobruto?: number
  volumes?: number
  altura?: number
  largura?: number
  profundidade?: number
}

export type VolumeConferenciaStatus = 'A' | 'F' | 'C'

export type VolumeConferencia = {
  nuconf: number
  seqvol: number
  ordem: number
  status: VolumeConferenciaStatus
  peso?: number
  altura?: number
  largura?: number
  profundidade?: number
  obs?: string
  codusuAbriu?: number
  dthabertura?: string
  codusuFechou?: number
  dthfechamento?: string
  qtditens?: number
}

export type VolumeConferenciaItem = {
  nuconf: number
  seqvol: number
  seqitem: number
  nuitem: number
  codprod: number
  descrprod: string
  controle?: string
  codbarra?: string
  codvol?: string
  qtd: number
  dthinclusao?: string
  codusu?: number
}

export type VolumeConferenciaResumo = {
  nuconf: number | null
  qtdVolumes: number
  volumesAbertos: number
  pesoTotal: number
  qtdItensVolume: number
}

export type WmsConfigCatalogItem = {
  key: string
  type: 'boolean' | 'number' | 'string' | 'json'
  defaultValue?: unknown
  description?: string
}

export type WmsConfigMeResponse = {
  values: Record<string, unknown>
  catalog: WmsConfigCatalogItem[]
  storageReady: boolean
}
