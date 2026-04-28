export type ProdutoEndereco = {
  codprod: number
  descrprod: string
  marca: string
  refforn: string
  referencia: string
  enderecoAtual: string
  enderecoCadastro: string
  qtdestoque: number
  codvol: string
  controle: string
}

export type EnderecoProdutoResponse = {
  enderecoCadastro: string
  produto: ProdutoEndereco
}

export type HistoricoEnderecoProduto = {
  dataAlteracao: Date | null
  dataAlteracaoRaw?: string
  usuario: string
  codusu: number
  tipoAlteracao: 'Edição' | 'Inserção' | 'Remoção'
  enderecoAnterior: string | null
  enderecoNovo: string | null
  camposAlterados: {
    modulo?: { oldValue: string; newValue: string }
    rua?: { oldValue: string; newValue: string }
    predio?: { oldValue: string; newValue: string }
    nivel?: { oldValue: string; newValue: string }
  }
}

export type EstoqueEnderecadoRequest = {
  codemp?: number
  codlocal?: number
  codprod?: number
  referencia?: string
  referenciaFornecedor?: string
  marca?: string
  codGrupoProd?: number
  enderecoInicio?: string
  enderecoFim?: string
  considerarEndVazios?: boolean
  desconsiderarDocas?: boolean
  desconsiderarCheckout?: boolean
  desconsiderarEnderecosEspeciais?: boolean
}

export type EstoqueEnderecadoItem = {
  CODEMP: number
  CODLOCAL: number
  CODPROD: number
  DESCRPROD: string
  MARCA?: string
  REFFORN?: string
  REFERENCIA?: string
  CODVOL?: string
  CODEND?: number
  ENDERECO?: string
  CONTROLE?: string
  ESTOQUE: number
  RESERVADO: number
  DISPONIVEL: number
}

export type EstoqueEnderecadoResponse = {
  success: boolean
  data: EstoqueEnderecadoItem[]
  message?: string
}

export type PendenciasMovimentacaoRequest = {
  codprod?: number
  codemp?: number
}

export type PendenciaMovimentacaoItem = {
  NUTAREFA: number
  TIPO: 'SEP' | 'CON' | string
  STATUS: 'P' | 'A' | 'D' | 'C' | string
  NUNOTA: number
  CODEMP: number
  CODONDA?: number
  NUITEM: number
  CODPROD: number
  DESCRPROD: string
  QTDPREVISTA: number
  QTDREALIZADA: number
  QTDPENDENTE: number
}

export type PendenciasMovimentacaoResponse = {
  success: boolean
  data: PendenciaMovimentacaoItem[]
  message?: string
}

export type ResumoValidadeQuery = {
  codemp?: number
  codlocal?: number
  codprod?: number
  diasAlerta?: number
}

export type ResumoValidadeData = {
  qtdVencido: number
  qtdProxVenc: number
  qtdEstoque: number
  diasAlerta: number
}

export type ResumoValidadeResponse = {
  success: boolean
  data: ResumoValidadeData
  message?: string
}

export type ArmPolicyConfig = {
  ARM_ORDEM_ESTRATEGIA: string[]
  ARM_PERMITE_DESTINO_SEM_UMA: boolean
  ARM_BLOQUEAR_SEM_ENDERECO_CADASTRO: boolean
  ARM_PROIBIR_UN_MENOR_PADRAO: boolean
  ARM_MULTI_PROD_END_MODO: 'alerta' | 'bloqueio'
  ARM_USAR_LASTRO_CAMADA: boolean
  ARM_SOMENTE_PALETE_COMPLETO: boolean
}

export type RegistrarMovimentacaoRequest = {
  codemp?: number
  codprod: number
  codvol?: string
  qtd?: number
  enderecoDestino?: string
  confirmarComAlerta?: boolean
  [key: string]: unknown
}

export type MovimentacaoPolicyPayload = {
  ok: boolean
  warnings: string[]
  errors: string[]
  effectiveConfig: ArmPolicyConfig | Record<string, unknown>
}

export type RegistrarMovimentacaoSuccess = {
  success: true
  message: string
  policy: MovimentacaoPolicyPayload & { ok: true }
}

export type RegistrarMovimentacaoBlocked = {
  success: false
  message: string
  policy: MovimentacaoPolicyPayload & { ok: false }
}

export type RegistrarMovimentacaoNeedConfirm = {
  success: false
  message: string
  requireConfirmation: true
  policy: MovimentacaoPolicyPayload & { ok: true }
}
