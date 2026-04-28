import { useMemo, useState } from 'react'
import { Alert } from 'react-native'
import type { ItemTarefaWms } from '../../../types/wms'
import { buildProgresso, ordenarRota } from './domain'

type UseTaskExecutionFlowOptions = {
  items: ItemTarefaWms[]
  taskLabel: string
  onApplyQuantidade: (item: ItemTarefaWms, qtd: number) => Promise<void>
}

export function useTaskExecutionFlow({ items, taskLabel, onApplyQuantidade }: UseTaskExecutionFlowOptions) {
  const [qtyModal, setQtyModal] = useState<{ item: ItemTarefaWms } | null>(null)
  const [qtyText, setQtyText] = useState('')
  const [listaModalOpen, setListaModalOpen] = useState(false)
  const [selectedNuitem, setSelectedNuitem] = useState<number | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  const itensOrdenados = useMemo(() => [...items].sort(ordenarRota), [items])
  const pendentes = useMemo(() => itensOrdenados.filter((i) => !i.ok && !i.divergencia), [itensOrdenados])
  const itemAtual = useMemo(() => {
    if (!itensOrdenados.length) return null
    if (selectedNuitem !== null) {
      const escolhido = itensOrdenados.find((i) => i.nuitem === selectedNuitem)
      if (escolhido) return escolhido
    }
    return pendentes[0] ?? itensOrdenados[0]
  }, [itensOrdenados, pendentes, selectedNuitem])
  const totais = useMemo(() => buildProgresso(items), [items])

  const abrirModalQtd = (item: ItemTarefaWms) => {
    setQtyText(item.qtdrealizada != null ? String(item.qtdrealizada) : String(item.qtdprevista))
    setQtyModal({ item })
  }

  const salvarQtd = async () => {
    if (!qtyModal || isApplying) return
    const q = parseFloat(qtyText.replace(',', '.'))
    if (Number.isNaN(q)) {
      Alert.alert(taskLabel, 'Quantidade inválida.')
      return
    }
    setIsApplying(true)
    try {
      await onApplyQuantidade(qtyModal.item, q)
      setSelectedNuitem(null)
      setQtyModal(null)
    } finally {
      setIsApplying(false)
    }
  }

  const marcarAchouTudo = async (item: ItemTarefaWms) => {
    if (isApplying) return
    setIsApplying(true)
    try {
      await onApplyQuantidade(item, item.qtdprevista)
      setSelectedNuitem(null)
    } finally {
      setIsApplying(false)
    }
  }

  const escolherItem = (nuitem: number) => {
    setSelectedNuitem(nuitem)
    setListaModalOpen(false)
  }

  return {
    qtyModal,
    qtyText,
    setQtyModal,
    setQtyText,
    listaModalOpen,
    setListaModalOpen,
    itemAtual,
    itensOrdenados,
    totais,
    abrirModalQtd,
    salvarQtd,
    marcarAchouTudo,
    escolherItem,
    isApplying,
  }
}
