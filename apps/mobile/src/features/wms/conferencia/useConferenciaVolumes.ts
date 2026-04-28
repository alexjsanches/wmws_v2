import { useCallback, useMemo, useState } from 'react'
import type { ItemTarefaWms, VolumeConferencia, VolumeConferenciaItem, VolumeConferenciaResumo } from '../../../types/wms'
import {
  getConferenciaVolumeItens,
  getConferenciaVolumes,
  getConferenciaVolumesResumo,
  postConferenciaVolumeAbrir,
  postConferenciaVolumeFechar,
  postConferenciaVolumeItemAdicionar,
  postConferenciaVolumeItemRemover,
} from '../../../services/wmsApi'
import { showWmsError, showWmsSuccess } from '../ui/feedback'

export type ModoConferencia = 'simples' | 'detalhado'

export function useConferenciaVolumes(nutarefa: number) {
  const [modo, setModo] = useState<ModoConferencia>('simples')
  const [resumo, setResumo] = useState<VolumeConferenciaResumo | null>(null)
  const [volumes, setVolumes] = useState<VolumeConferencia[]>([])
  const [loadingVolumes, setLoadingVolumes] = useState(false)
  const [itensVolumeOpen, setItensVolumeOpen] = useState<{ seqvol: number; itens: VolumeConferenciaItem[]; loading: boolean } | null>(null)

  const loadVolumes = useCallback(async () => {
    if (modo !== 'detalhado') return
    setLoadingVolumes(true)
    try {
      const [r, v] = await Promise.all([getConferenciaVolumesResumo(nutarefa), getConferenciaVolumes(nutarefa)])
      setResumo(r)
      setVolumes(v)
    } catch (e) {
      showWmsError('Volumes', e, 'Erro ao carregar volumes.')
    } finally {
      setLoadingVolumes(false)
    }
  }, [modo, nutarefa])

  const volumeAberto = useMemo(() => volumes.find((v) => v.status === 'A') ?? null, [volumes])

  const abrirVolume = useCallback(async (obs?: string) => {
    try {
      await postConferenciaVolumeAbrir(nutarefa, { obs })
      await loadVolumes()
    } catch (e) {
      showWmsError('Volumes', e, 'Erro ao abrir volume.')
    }
  }, [loadVolumes, nutarefa])

  const fecharVolume = useCallback(async (seqvol: number) => {
    try {
      await postConferenciaVolumeFechar(nutarefa, seqvol, {})
      showWmsSuccess('Volumes', `Volume ${seqvol} fechado.`)
      await loadVolumes()
    } catch (e) {
      showWmsError('Volumes', e, 'Erro ao fechar volume.')
    }
  }, [loadVolumes, nutarefa])

  const adicionarItemAtualAoVolume = useCallback(async (item: ItemTarefaWms, qtd: number) => {
    if (!volumeAberto) {
      showWmsError('Volumes', new Error('Abra um volume antes de adicionar itens.'), 'Abra um volume antes de adicionar itens.')
      return
    }
    try {
      await postConferenciaVolumeItemAdicionar(nutarefa, volumeAberto.seqvol, {
        nuitem: item.nuitem,
        codprod: item.codprod,
        qtd,
        controle: item.controle,
        codvol: item.codvol,
        codbarra: item.codbarra,
      })
      showWmsSuccess('Volumes', `Item adicionado ao volume ${volumeAberto.seqvol}.`)
      await loadVolumes()
    } catch (e) {
      showWmsError('Volumes', e, 'Erro ao adicionar item ao volume.')
    }
  }, [loadVolumes, nutarefa, volumeAberto])

  const abrirItensVolume = useCallback(async (seqvol: number) => {
    setItensVolumeOpen({ seqvol, itens: [], loading: true })
    try {
      const itens = await getConferenciaVolumeItens(nutarefa, seqvol)
      setItensVolumeOpen({ seqvol, itens, loading: false })
    } catch (e) {
      setItensVolumeOpen(null)
      showWmsError('Volumes', e, 'Erro ao carregar itens do volume.')
    }
  }, [nutarefa])

  const removerItemVolume = useCallback(async (seqvol: number, seqitem: number) => {
    try {
      await postConferenciaVolumeItemRemover(nutarefa, seqvol, { seqitem })
      const itens = await getConferenciaVolumeItens(nutarefa, seqvol)
      setItensVolumeOpen({ seqvol, itens, loading: false })
      await loadVolumes()
    } catch (e) {
      showWmsError('Volumes', e, 'Erro ao remover item do volume.')
    }
  }, [loadVolumes, nutarefa])

  return {
    modo,
    setModo,
    resumo,
    volumes,
    loadingVolumes,
    volumeAberto,
    loadVolumes,
    abrirVolume,
    fecharVolume,
    adicionarItemAtualAoVolume,
    itensVolumeOpen,
    setItensVolumeOpen,
    abrirItensVolume,
    removerItemVolume,
  }
}
