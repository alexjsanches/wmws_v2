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

  const reload = useCallback(async () => {
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
    void reload()
  }, [reload])

  const aplicarQuantidade = useCallback(
    async (item: ItemTarefaWms, qtd: number) => {
      try {
        await applyConferenciaItemQtyUseCase({ nutarefa, item, qtd })
        await reload()
      } catch (e) {
        showWmsError('Conferência', e, 'Erro ao salvar')
      }
    },
    [reload, nutarefa],
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

  const concludeTask = useCallback(async () => {
    try {
      await concludeConferenciaTaskUseCase({ nutarefa, payload: buildPayload() })
      setFechamentoModalOpen(false)
      showWmsSuccess('Conferência', 'Tarefa concluída.', onConcluded)
    } catch (e) {
      showWmsError('Conferência', e, 'Erro ao concluir')
    }
  }, [buildPayload, nutarefa, onConcluded, setFechamentoModalOpen])

  const addCurrentItemToVolume = useCallback(() => {
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
    reload,
    qtdVolumeText,
    setQtdVolumeText,
    obsNovoVolume,
    setObsNovoVolume,
    concludeTask,
    addCurrentItemToVolume,
    flow,
    fechamento,
    volumes,
  }
}
