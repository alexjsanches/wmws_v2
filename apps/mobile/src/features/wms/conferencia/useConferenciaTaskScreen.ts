import { useCallback, useEffect, useState } from 'react'
import {
  applyConferenciaItemQtyUseCase,
  concludeConferenciaTaskUseCase,
  loadConferenciaTaskUseCase,
} from '../../../application/use-cases'
import { showWmsError, showWmsSuccess } from '../ui/feedback'
import { useConferenciaFechamento } from './useConferenciaFechamento'
import { useConferenciaVolumes } from './useConferenciaVolumes'
import { useTaskExecutionFlow } from '../taskExecution/useTaskExecutionFlow'
import type { ItemTarefaWms } from '../../../types/wms'

export function useConferenciaTaskScreen(params: { nutarefa: number; onConcluded?: () => void }) {
  const { nutarefa, onConcluded } = params
  const [items, setItems] = useState<ItemTarefaWms[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qtdVolumeText, setQtdVolumeText] = useState('1')
  const [obsNovoVolume, setObsNovoVolume] = useState('')

  const loadItens = useCallback(async () => {
    setError(null)
    try {
      const data = await loadConferenciaTaskUseCase(nutarefa)
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar itens')
      setItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [nutarefa])

  useEffect(() => {
    void loadItens()
  }, [loadItens])

  const aplicarQuantidade = useCallback(
    async (item: ItemTarefaWms, qtd: number) => {
      try {
        await applyConferenciaItemQtyUseCase({ nutarefa, item, qtd })
        await loadItens()
      } catch (e) {
        showWmsError('Conferência', e, 'Erro ao salvar')
      }
    },
    [loadItens, nutarefa],
  )

  const flow = useTaskExecutionFlow({
    items,
    taskLabel: 'Conferência',
    onApplyQuantidade: aplicarQuantidade,
  })

  const fechamento = useConferenciaFechamento(items)
  const volumes = useConferenciaVolumes(nutarefa)
  const { modo, loadVolumes, adicionarItemAtualAoVolume } = volumes
  const { buildPayload, setFechamentoModalOpen } = fechamento

  useEffect(() => {
    if (modo === 'detalhado') {
      void loadVolumes()
    }
  }, [loadVolumes, modo])

  const confirmConclusion = useCallback(async () => {
    try {
      await concludeConferenciaTaskUseCase({ nutarefa, payload: buildPayload() })
      setFechamentoModalOpen(false)
      showWmsSuccess('Conferência', 'Tarefa concluída.', onConcluded)
    } catch (e) {
      showWmsError('Conferência', e, 'Erro ao concluir')
    }
  }, [buildPayload, nutarefa, onConcluded, setFechamentoModalOpen])

  const addCurrentItemToOpenVolume = useCallback(() => {
    if (!flow.itemAtual) return
    const qtd = Number(String(qtdVolumeText).replace(',', '.'))
    if (!Number.isFinite(qtd) || qtd <= 0) {
      showWmsError('Volumes', new Error('Quantidade inválida.'), 'Informe uma quantidade válida.')
      return
    }
    void adicionarItemAtualAoVolume(flow.itemAtual, qtd)
  }, [adicionarItemAtualAoVolume, flow.itemAtual, qtdVolumeText])

  return {
    items,
    loading,
    refreshing,
    error,
    setRefreshing,
    loadItens,
    qtdVolumeText,
    setQtdVolumeText,
    obsNovoVolume,
    setObsNovoVolume,
    confirmConclusion,
    addCurrentItemToOpenVolume,
    flow,
    fechamento,
    volumes,
  }
}
