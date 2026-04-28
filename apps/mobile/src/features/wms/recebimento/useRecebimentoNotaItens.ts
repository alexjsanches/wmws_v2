import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { isDomainError } from '../../../application/DomainError'
import {
  concludeRecebimentoTaskUseCase,
  createRecebimentoTaskUseCase,
  loadRecebimentoNotaItensUseCase,
  saveRecebimentoItemQtyUseCase,
} from '../../../application/use-cases'
import { showWmsConfirm, showWmsError, showWmsSuccess } from '../ui/feedback'
import type { ItemNota } from '../../../types/wms'

export function useRecebimentoNotaItens(params: {
  nunota: number
  codemp: number
  initialNutarefa?: number
  onConcluded?: () => void
}) {
  const { nunota, codemp, initialNutarefa, onConcluded } = params
  const [nutarefa, setNutarefa] = useState<number | undefined>(initialNutarefa)
  const [items, setItems] = useState<ItemNota[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qtyModal, setQtyModal] = useState<{ item: ItemNota } | null>(null)
  const [qtyText, setQtyText] = useState('')

  const reload = useCallback(async () => {
    setError(null)
    try {
      const data = await loadRecebimentoNotaItensUseCase(nunota)
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar itens')
      setItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [nunota])

  useEffect(() => {
    void reload()
  }, [reload])

  const createTask = useCallback(async () => {
    try {
      const nu = await createRecebimentoTaskUseCase({ nunota, codemp })
      setNutarefa(nu)
      await reload()
    } catch (e) {
      showWmsError('Recebimento', e, 'Erro ao criar tarefa')
    }
  }, [codemp, reload, nunota])

  const openQtyModal = useCallback((item: ItemNota) => {
    if (!nutarefa) {
      Alert.alert('Recebimento', 'Crie a tarefa de recebimento antes de lançar quantidades.')
      return
    }
    setQtyText(item.qtdrealizada != null ? String(item.qtdrealizada) : String(item.qtdprevista))
    setQtyModal({ item })
  }, [nutarefa])

  const saveQty = useCallback(async () => {
    if (!qtyModal) return
    try {
      await saveRecebimentoItemQtyUseCase({
        nutarefa,
        nuitem: qtyModal.item.nuitem,
        qtyText,
      })
      setQtyModal(null)
      await reload()
    } catch (e) {
      if (isDomainError(e) && (e.code === 'RECEBIMENTO_QTY_INVALID' || e.code === 'RECEBIMENTO_TASK_REQUIRED')) {
        Alert.alert('Recebimento', e.message)
        return
      }
      showWmsError('Recebimento', e, 'Erro ao salvar')
    }
  }, [reload, nutarefa, qtyModal, qtyText])

  const concludeTask = useCallback(() => {
    if (!nutarefa) {
      Alert.alert('Recebimento', 'Crie a tarefa antes de concluir.')
      return
    }
    showWmsConfirm(
      'Concluir recebimento',
      'Confirma a conclusão desta tarefa? Será gerada a tarefa de armazenagem.',
      async () => {
        try {
          await concludeRecebimentoTaskUseCase(nutarefa)
          showWmsSuccess('Recebimento', 'Tarefa concluída.', onConcluded)
        } catch (e) {
          if (isDomainError(e) && e.code === 'RECEBIMENTO_TASK_REQUIRED') {
            Alert.alert('Recebimento', e.message)
            return
          }
          showWmsError('Recebimento', e, 'Erro ao concluir')
        }
      },
      { confirmText: 'Concluir' },
    )
  }, [nutarefa, onConcluded])

  return {
    nutarefa,
    items,
    loading,
    refreshing,
    error,
    qtyModal,
    qtyText,
    setQtyModal,
    setQtyText,
    setRefreshing,
    reload,
    createTask,
    openQtyModal,
    saveQty,
    concludeTask,
  }
}
