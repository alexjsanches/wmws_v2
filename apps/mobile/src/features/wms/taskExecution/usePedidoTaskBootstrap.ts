import { useCallback, useEffect, useState } from 'react'
import { showWmsError, showWmsSuccess } from '../ui/feedback'
import type { ItemTarefaWms } from '../../../types/wms'

type StartTaskResponse = {
  existente?: boolean
  nutarefa: number
  codonda?: number | null
}

export function usePedidoTaskBootstrap(params: {
  nunota: number
  codemp: number
  taskLabel: 'Separação' | 'Conferência'
  loadItems: (nunota: number) => Promise<ItemTarefaWms[]>
  startTask: (payload: { nunota: number; codemp: number }) => Promise<StartTaskResponse>
  onTaskOpened: (payload: { nutarefa: number; codonda?: number | null }) => void
}) {
  const { nunota, codemp, taskLabel, loadItems, startTask, onTaskOpened } = params
  const [items, setItems] = useState<ItemTarefaWms[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [criando, setCriando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await loadItems(nunota)
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
      setItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [loadItems, nunota])

  useEffect(() => {
    void load()
  }, [load])

  const iniciar = useCallback(async () => {
    setCriando(true)
    try {
      const res = await startTask({ nunota, codemp })
      const taskCode = taskLabel === 'Conferência' ? 'CON' : 'SEP'
      const msg = res.existente === true ? `Já existia tarefa ${taskCode} — abrindo.` : 'Tarefa criada.'
      showWmsSuccess(taskLabel, msg, () => onTaskOpened({ nutarefa: res.nutarefa, codonda: res.codonda }))
    } catch (e) {
      showWmsError(taskLabel, e, 'Erro ao criar tarefa')
    } finally {
      setCriando(false)
    }
  }, [codemp, nunota, onTaskOpened, startTask, taskLabel])

  return {
    items,
    loading,
    refreshing,
    criando,
    error,
    setRefreshing,
    load,
    iniciar,
  }
}
