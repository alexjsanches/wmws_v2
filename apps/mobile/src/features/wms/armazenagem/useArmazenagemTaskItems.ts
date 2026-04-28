import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { isDomainError } from '../../../application/DomainError'
import {
  concludeArmazenagemTaskUseCase,
  loadArmazenagemTaskItemsUseCase,
  saveArmazenagemItemUseCase,
} from '../../../application/use-cases'
import { showWmsConfirm, showWmsError, showWmsSuccess } from '../ui/feedback'
import type { ItemArmazenagem } from '../../../types/wms'

export function useArmazenagemTaskItems(params: { nutarefa: number; onConcluded?: () => void }) {
  const { nutarefa, onConcluded } = params
  const [items, setItems] = useState<ItemArmazenagem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<{ item: ItemArmazenagem } | null>(null)
  const [qtd, setQtd] = useState('')
  const [localLivre, setLocalLivre] = useState('')

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await loadArmazenagemTaskItemsUseCase(nutarefa)
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
      setItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [nutarefa])

  useEffect(() => {
    void load()
  }, [load])

  const openModal = useCallback((item: ItemArmazenagem) => {
    setQtd(item.qtdrealizada != null ? String(item.qtdrealizada) : String(item.qtdprevista))
    setLocalLivre(item.local_livre ?? '')
    setModal({ item })
  }, [])

  const saveItem = useCallback(async () => {
    if (!modal) return
    try {
      await saveArmazenagemItemUseCase({
        nutarefa,
        nuitem: modal.item.nuitem,
        qtyText: qtd,
        localLivreText: localLivre,
      })
      setModal(null)
      await load()
    } catch (e) {
      if (isDomainError(e) && e.code === 'ARMAZENAGEM_QTY_INVALID') {
        Alert.alert('Armazenagem', e.message)
        return
      }
      showWmsError('Armazenagem', e, 'Erro ao salvar')
    }
  }, [load, localLivre, modal, nutarefa, qtd])

  const concludeTask = useCallback(() => {
    showWmsConfirm(
      'Concluir armazenagem',
      'Confirma a conclusão desta tarefa?',
      async () => {
        try {
          await concludeArmazenagemTaskUseCase(nutarefa)
          showWmsSuccess('Armazenagem', 'Tarefa concluída.', onConcluded)
        } catch (e) {
          showWmsError('Armazenagem', e, 'Erro ao concluir')
        }
      },
      { confirmText: 'Concluir' },
    )
  }, [nutarefa, onConcluded])

  return {
    items,
    loading,
    refreshing,
    error,
    modal,
    qtd,
    localLivre,
    setModal,
    setQtd,
    setLocalLivre,
    setRefreshing,
    load,
    openModal,
    saveItem,
    concludeTask,
  }
}
