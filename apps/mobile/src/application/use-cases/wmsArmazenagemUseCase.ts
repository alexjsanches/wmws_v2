import {
  getArmazenagemTarefaItens,
  getArmazenagemTarefasPendentes,
  patchArmazenagemItem,
  postArmazenagemConcluir,
} from '../../services/wmsApi'
import { DomainError } from '../DomainError'
import type { ItemArmazenagem, TarefaResumo } from '../../types/wms'

export async function loadArmazenagemListUseCase(): Promise<TarefaResumo[]> {
  return getArmazenagemTarefasPendentes()
}

export async function loadArmazenagemTaskItemsUseCase(nutarefa: number): Promise<ItemArmazenagem[]> {
  return getArmazenagemTarefaItens(nutarefa)
}

export async function saveArmazenagemItemUseCase(params: {
  nutarefa: number
  nuitem: number
  qtyText: string
  localLivreText?: string
}): Promise<void> {
  const q = parseFloat(params.qtyText.replace(',', '.'))
  if (Number.isNaN(q)) {
    throw new DomainError('ARMAZENAGEM_QTY_INVALID', 'Quantidade inválida.')
  }
  await patchArmazenagemItem(params.nutarefa, params.nuitem, {
    qtdrealizada: q,
    local_livre: params.localLivreText?.trim() || undefined,
  })
}

export async function concludeArmazenagemTaskUseCase(nutarefa: number): Promise<void> {
  await postArmazenagemConcluir(nutarefa)
}
