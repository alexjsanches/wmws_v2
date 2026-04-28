import { getSeparacaoTarefaItens, getSeparacaoTarefaResumo, patchSeparacaoItem, postSeparacaoConcluir } from '../../services/wmsApi'
import { buildDivergencias } from '../../features/wms/taskExecution/domain'
import { DomainError } from '../DomainError'
import type { ItemTarefaWms, SeparacaoTarefaResumo } from '../../types/wms'

export type SeparacaoTaskData = {
  items: ItemTarefaWms[]
  resumo: SeparacaoTarefaResumo | null
}

export async function loadSeparacaoTaskUseCase(nutarefa: number): Promise<SeparacaoTaskData> {
  const [items, resumo] = await Promise.all([
    getSeparacaoTarefaItens(nutarefa),
    getSeparacaoTarefaResumo(nutarefa).catch(() => null),
  ])
  return { items, resumo }
}

export async function applySeparacaoItemQtyUseCase(params: {
  nutarefa: number
  item: ItemTarefaWms
  qtd: number
}): Promise<void> {
  await patchSeparacaoItem(params.nutarefa, params.item.nuitem, {
    qtdrealizada: params.qtd,
    controle: params.item.controle,
  })
}

export async function concludeSeparacaoTaskUseCase(params: {
  nutarefa: number
  enderecoArea: string
  items: ItemTarefaWms[]
}): Promise<void> {
  const endereco = params.enderecoArea.trim()
  if (!endereco) {
    throw new DomainError('SEPARACAO_ENDERECO_REQUIRED', 'Informe onde os itens foram deixados para conferência.')
  }
  await postSeparacaoConcluir(params.nutarefa, {
    enderecoArea: endereco,
    divergencias: buildDivergencias(params.items),
  })
}
