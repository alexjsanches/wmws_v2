import {
  getRecebimentoNotaItens,
  getRecebimentoNotasPendentes,
  patchRecebimentoItem,
  postRecebimentoConcluir,
  postRecebimentoTarefa,
} from '../../services/wmsApi'
import { DomainError } from '../DomainError'
import type { ItemNota, TarefaResumo } from '../../types/wms'

export async function loadRecebimentoListUseCase(): Promise<TarefaResumo[]> {
  return getRecebimentoNotasPendentes()
}

export async function loadRecebimentoNotaItensUseCase(nunota: number): Promise<ItemNota[]> {
  return getRecebimentoNotaItens(nunota)
}

export async function createRecebimentoTaskUseCase(params: { nunota: number; codemp: number }): Promise<number> {
  const { nutarefa } = await postRecebimentoTarefa(params)
  return nutarefa
}

export async function saveRecebimentoItemQtyUseCase(params: {
  nutarefa?: number
  nuitem: number
  qtyText: string
}): Promise<void> {
  if (!params.nutarefa) {
    throw new DomainError('RECEBIMENTO_TASK_REQUIRED', 'Crie a tarefa de recebimento antes de lançar quantidades.')
  }
  const q = parseFloat(params.qtyText.replace(',', '.'))
  if (Number.isNaN(q)) {
    throw new DomainError('RECEBIMENTO_QTY_INVALID', 'Quantidade inválida.')
  }
  await patchRecebimentoItem(params.nutarefa, params.nuitem, { qtdrealizada: q })
}

export async function concludeRecebimentoTaskUseCase(nutarefa?: number): Promise<void> {
  if (!nutarefa) {
    throw new DomainError('RECEBIMENTO_TASK_REQUIRED', 'Crie a tarefa antes de concluir.')
  }
  await postRecebimentoConcluir(nutarefa, {})
}
