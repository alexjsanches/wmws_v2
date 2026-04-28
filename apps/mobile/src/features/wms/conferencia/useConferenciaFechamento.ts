import { useMemo, useState } from 'react'
import type {
  CorteConferenciaPayload,
  DivergenciaConcluirPayload,
  FechamentoConferenciaPayload,
  ItemTarefaWms,
} from '../../../types/wms'
import { buildDivergencias, parseOptionalNumber } from '../taskExecution/domain'

export function useConferenciaFechamento(items: ItemTarefaWms[]) {
  const [fechamentoModalOpen, setFechamentoModalOpen] = useState(false)
  const [enderecoExpedicao, setEnderecoExpedicao] = useState('')
  const [pesoBruto, setPesoBruto] = useState('')
  const [volumes, setVolumes] = useState('')
  const [altura, setAltura] = useState('')
  const [largura, setLargura] = useState('')
  const [profundidade, setProfundidade] = useState('')
  const [divergenciaMeta, setDivergenciaMeta] = useState<Record<number, { motivo: string; subtipo: string }>>({})
  const [corteMeta, setCorteMeta] = useState<Record<number, { qtdcorte: string; motivo: string }>>({})

  const divergenciasBase = useMemo(() => buildDivergencias(items), [items])

  const buildPayload = () => {
    const divergenciasPayload: DivergenciaConcluirPayload[] = divergenciasBase.map((d) => ({
      ...d,
      motivo: divergenciaMeta[d.nuitem]?.motivo?.trim() || undefined,
      subtipo: divergenciaMeta[d.nuitem]?.subtipo?.trim() || undefined,
    }))

    const cortesPayload: CorteConferenciaPayload[] = divergenciasBase.reduce<CorteConferenciaPayload[]>((acc, d) => {
      const meta = corteMeta[d.nuitem]
      if (!meta) return acc
      const qtd = parseFloat(String(meta.qtdcorte || '').replace(',', '.'))
      if (!Number.isFinite(qtd) || qtd <= 0) return acc
      acc.push({
        nuitem: d.nuitem,
        qtdcorte: qtd,
        motivo: meta.motivo?.trim() || undefined,
      })
      return acc
    }, [])

    const fechamento: FechamentoConferenciaPayload = {
      pesobruto: parseOptionalNumber(pesoBruto),
      volumes: parseOptionalNumber(volumes),
      altura: parseOptionalNumber(altura),
      largura: parseOptionalNumber(largura),
      profundidade: parseOptionalNumber(profundidade),
    }
    const temFechamento = Object.values(fechamento).some((v) => v !== undefined)

    return {
      enderecoExpedicao: enderecoExpedicao.trim() || undefined,
      divergencias: divergenciasPayload,
      cortes: cortesPayload.length ? cortesPayload : undefined,
      fechamento: temFechamento ? fechamento : undefined,
    }
  }

  return {
    fechamentoModalOpen,
    setFechamentoModalOpen,
    enderecoExpedicao,
    setEnderecoExpedicao,
    pesoBruto,
    setPesoBruto,
    volumes,
    setVolumes,
    altura,
    setAltura,
    largura,
    setLargura,
    profundidade,
    setProfundidade,
    divergenciaMeta,
    setDivergenciaMeta,
    corteMeta,
    setCorteMeta,
    divergenciasBase,
    buildPayload,
  }
}
