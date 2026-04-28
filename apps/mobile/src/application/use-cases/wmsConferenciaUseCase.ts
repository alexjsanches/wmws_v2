import { getConferenciaTarefaItens, patchConferenciaItem, postConferenciaConcluir } from '../../services/wmsApi'
import type { ItemTarefaWms } from '../../types/wms'
import type {
  CorteConferenciaPayload,
  DivergenciaConcluirPayload,
  FechamentoConferenciaPayload,
} from '../../types/wms'

export async function loadConferenciaTaskUseCase(nutarefa: number): Promise<ItemTarefaWms[]> {
  return getConferenciaTarefaItens(nutarefa)
}

export async function applyConferenciaItemQtyUseCase(params: {
  nutarefa: number
  item: ItemTarefaWms
  qtd: number
}): Promise<void> {
  await patchConferenciaItem(params.nutarefa, params.item.nuitem, {
    qtdrealizada: params.qtd,
    controle: params.item.controle,
  })
}

export async function concludeConferenciaTaskUseCase(params: {
  nutarefa: number
  payload: {
    divergencias?: DivergenciaConcluirPayload[]
    enderecoExpedicao?: string
    cortes?: CorteConferenciaPayload[]
    fechamento?: FechamentoConferenciaPayload
  }
}): Promise<void> {
  await postConferenciaConcluir(params.nutarefa, params.payload)
}
