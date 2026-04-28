import {
  getConferenciaPedidosPendentes,
  getConferenciaTarefasPendentes,
  getSeparacaoOrdensPendentes,
  getSeparacaoTarefasPendentes,
} from '../../services/wmsApi'
import type { OrdemWmsCab, TarefaWmsLista } from '../../types/wms'

export type SeparacaoBoardData = {
  ordens: OrdemWmsCab[]
  tarefas: TarefaWmsLista[]
}

export type ConferenciaBoardData = {
  pedidos: OrdemWmsCab[]
  tarefas: TarefaWmsLista[]
}

export async function loadSeparacaoBoardUseCase(): Promise<SeparacaoBoardData> {
  const [ordens, tarefas] = await Promise.all([getSeparacaoOrdensPendentes(), getSeparacaoTarefasPendentes()])
  return { ordens, tarefas }
}

export async function loadConferenciaBoardUseCase(): Promise<ConferenciaBoardData> {
  const [pedidos, tarefas] = await Promise.all([getConferenciaPedidosPendentes(), getConferenciaTarefasPendentes()])
  return { pedidos, tarefas }
}
