import type { NavigatorScreenParams } from '@react-navigation/native'

export type FerramentasStackParamList = {
  FerramentasInicio: undefined
  ConsultaProduto: undefined
  GerenciaExtrato: undefined
  WmsConfiguracoes: undefined
}

export type HomeStackParamList = {
  Dashboard: undefined
  ShowcaseComponents: undefined
  RecebimentoLista: undefined
  RecebimentoNotaItens: { nunota: number; codemp: number; nutarefa?: number }
  ArmazenagemLista: undefined
  ArmazenagemTarefaItens: { nutarefa: number }
  MovimentacaoProativaHub: undefined
  MovimentacaoPorEndereco: { codemp: number }
  MovimentacaoPorProduto: { codemp: number }
  SeparacaoLista: undefined
  SeparacaoOrdemItens: { nunota: number; codemp: number; numnota?: string }
  SeparacaoTarefaItens: { nutarefa: number; nunota: number; numnota?: string; codonda?: number }
  ConferenciaLista: undefined
  ConferenciaPedidoItens: { nunota: number; codemp: number; numnota?: string }
  ConferenciaTarefaItens: { nutarefa: number; nunota: number; numnota?: string; codonda?: number }
}

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined
  Ferramentas: NavigatorScreenParams<FerramentasStackParamList> | undefined
  Adicionar: undefined
  Scanner: undefined
  Perfil: undefined
}
