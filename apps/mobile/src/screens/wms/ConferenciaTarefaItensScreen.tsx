import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space } from '@wms/theme'
import {
  applyConferenciaItemQtyUseCase,
  concludeConferenciaTaskUseCase,
  loadConferenciaTaskUseCase,
} from '../../application/use-cases'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ConferenciaFechamentoModal } from '../../features/wms/conferencia/ConferenciaFechamentoModal'
import { useConferenciaFechamento } from '../../features/wms/conferencia/useConferenciaFechamento'
import { useConferenciaVolumes } from '../../features/wms/conferencia/useConferenciaVolumes'
import { CurrentItemCard, TaskProgressoCard } from '../../features/wms/taskExecution/TaskCards'
import { ItemPickerModal, QtyInputModal } from '../../features/wms/taskExecution/TaskModals'
import { BaseActionModal } from '../../features/wms/ui/BaseActionModal'
import { showWmsError, showWmsSuccess } from '../../features/wms/ui/feedback'
import { useTaskExecutionFlow } from '../../features/wms/taskExecution/useTaskExecutionFlow'
import type { HomeStackParamList } from '../../navigation/types'
import type { ItemTarefaWms } from '../../types/wms'

type Props = NativeStackScreenProps<HomeStackParamList, 'ConferenciaTarefaItens'>

export function ConferenciaTarefaItensScreen({ navigation, route }: Props) {
  const { nutarefa, nunota, numnota, codonda } = route.params
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

  const aplicarQuantidade = useCallback(async (item: ItemTarefaWms, qtd: number) => {
    try {
      await applyConferenciaItemQtyUseCase({ nutarefa, item, qtd })
      await loadItens()
    } catch (e) {
      showWmsError('Conferência', e, 'Erro ao salvar')
    }
  }, [loadItens, nutarefa])

  const {
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
  } = useTaskExecutionFlow({
    items,
    taskLabel: 'Conferência',
    onApplyQuantidade: aplicarQuantidade,
  })

  const {
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
  } = useConferenciaFechamento(items)

  const {
    modo,
    setModo,
    resumo,
    volumes: volumesConferencia,
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
  } = useConferenciaVolumes(nutarefa)

  useEffect(() => {
    if (modo === 'detalhado') {
      void loadVolumes()
    }
  }, [loadVolumes, modo])

  const confirmarConclusao = async () => {
    try {
      await concludeConferenciaTaskUseCase({ nutarefa, payload: buildPayload() })
      setFechamentoModalOpen(false)
      showWmsSuccess('Conferência', 'Tarefa concluída.', () => navigation.goBack())
    } catch (e) {
      showWmsError('Conferência', e, 'Erro ao concluir')
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={`Tarefa #${nutarefa}`} onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={`Conferência · ${numnota ? `NF ${numnota}` : `NUNOTA ${nunota}`} (#${nutarefa}${codonda ? ` · Onda ${codonda}` : ''})`}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadItens() }} />}
      >
        <TaskProgressoCard titulo="Progresso da conferência" totais={totais} />

        <Card>
          <Text style={styles.cardTitle}>Modo de conferência</Text>
          <View style={styles.rowBtns}>
            <Button
              variant={modo === 'simples' ? 'primary' : 'outline'}
              onPress={() => setModo('simples')}
              style={{ flex: 1 }}
            >
              Simples
            </Button>
            <Button
              variant={modo === 'detalhado' ? 'primary' : 'outline'}
              onPress={() => setModo('detalhado')}
              style={{ flex: 1 }}
            >
              Detalhado por volume
            </Button>
          </View>
          <Text style={styles.meta}>
            {modo === 'simples'
              ? 'Finaliza conferência só com totais no fechamento.'
              : 'Permite abrir volumes/caixas e alocar itens durante a conferência.'}
          </Text>
        </Card>

        {modo === 'detalhado' ? (
          <Card>
            <Text style={styles.cardTitle}>Volumes da conferência</Text>
            {loadingVolumes ? <ActivityIndicator color={colors.primary} /> : null}
            <Text style={styles.metaStrong}>
              Resumo: {resumo?.qtdVolumes ?? 0} volumes | {resumo?.volumesAbertos ?? 0} abertos | {resumo?.qtdItensVolume ?? 0} itens
            </Text>
            <View style={styles.rowBtns}>
              <Button variant="outline" onPress={() => void loadVolumes()} style={{ flex: 1 }}>
                Atualizar
              </Button>
              <Button
                onPress={() => {
                  void abrirVolume(obsNovoVolume.trim() || undefined)
                  setObsNovoVolume('')
                }}
                style={{ flex: 1 }}
              >
                Abrir volume
              </Button>
            </View>
            <Input
              value={obsNovoVolume}
              onChangeText={setObsNovoVolume}
              placeholder="Ex.: caixa itens pequenos"
            />
            {volumeAberto ? (
              <View style={styles.volumeAbertoBox}>
                <Text style={styles.metaStrong}>Volume aberto: #{volumeAberto.seqvol}</Text>
                <View style={styles.rowBtns}>
                  <Button variant="outline" onPress={() => void abrirItensVolume(volumeAberto.seqvol)} style={{ flex: 1 }}>
                    Ver itens
                  </Button>
                  <Button variant="danger" onPress={() => void fecharVolume(volumeAberto.seqvol)} style={{ flex: 1 }}>
                    Fechar volume
                  </Button>
                </View>
              </View>
            ) : (
              <Text style={styles.meta}>Nenhum volume aberto no momento.</Text>
            )}
            <View style={styles.listGap}>
              {volumesConferencia.map((v) => (
                <View key={v.seqvol} style={styles.volumeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaStrong}>Volume #{v.seqvol} ({v.status})</Text>
                    <Text style={styles.meta}>Itens: {v.qtditens ?? 0} | Ordem: {v.ordem}</Text>
                  </View>
                  <Button variant="outline" onPress={() => void abrirItensVolume(v.seqvol)}>
                    Itens
                  </Button>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <View style={styles.rowBtns}>
          <Button variant="outline" onPress={() => setListaModalOpen(true)} style={{ flex: 1 }}>
            Abrir lista de itens
          </Button>
          <Button variant="success" onPress={() => setFechamentoModalOpen(true)} style={{ flex: 1 }}>
            Concluir tarefa
          </Button>
        </View>

        {error ? <Text style={styles.err}>{error}</Text> : null}

        <CurrentItemCard
          item={itemAtual}
          primaryActionLabel="Conferir total"
          secondaryActionLabel="Informar quantidade"
          actionLoading={isApplying}
          onPrimaryAction={(item) => marcarAchouTudo(item)}
          onSecondaryAction={(item) => abrirModalQtd(item)}
        />

        {modo === 'detalhado' ? (
          <Card>
            <Text style={styles.cardTitle}>Alocar item atual no volume aberto</Text>
            <Input
              value={qtdVolumeText}
              onChangeText={setQtdVolumeText}
              placeholder="Ex.: 1"
              keyboardType="decimal-pad"
            />
            <Button
              disabled={!itemAtual || !volumeAberto}
              onPress={() => {
                if (!itemAtual) return
                const qtd = Number(String(qtdVolumeText).replace(',', '.'))
                if (!Number.isFinite(qtd) || qtd <= 0) {
                  showWmsError('Volumes', new Error('Quantidade inválida.'), 'Informe uma quantidade válida.')
                  return
                }
                void adicionarItemAtualAoVolume(itemAtual, qtd)
              }}
            >
              Adicionar item atual
            </Button>
            <Text style={styles.meta}>{volumeAberto ? `Volume destino: #${volumeAberto.seqvol}` : 'Abra um volume para começar.'}</Text>
          </Card>
        ) : null}
      </ScrollView>

      <ItemPickerModal
        visible={listaModalOpen}
        items={itensOrdenados}
        onPick={escolherItem}
        onClose={() => setListaModalOpen(false)}
      />

      <QtyInputModal
        visible={qtyModal != null}
        item={qtyModal?.item ?? null}
        value={qtyText}
        onChange={setQtyText}
        title="Quantidade conferida"
        loading={isApplying}
        onCancel={() => setQtyModal(null)}
        onConfirm={() => void salvarQtd()}
      />

      <ConferenciaFechamentoModal
        visible={fechamentoModalOpen}
        onClose={() => setFechamentoModalOpen(false)}
        onConfirm={() => void confirmarConclusao()}
        enderecoExpedicao={enderecoExpedicao}
        setEnderecoExpedicao={setEnderecoExpedicao}
        pesoBruto={pesoBruto}
        setPesoBruto={setPesoBruto}
        volumes={volumes}
        setVolumes={setVolumes}
        altura={altura}
        setAltura={setAltura}
        largura={largura}
        setLargura={setLargura}
        profundidade={profundidade}
        setProfundidade={setProfundidade}
        divergenciasBase={divergenciasBase}
        divergenciaMeta={divergenciaMeta}
        setDivergenciaMeta={setDivergenciaMeta}
        corteMeta={corteMeta}
        setCorteMeta={setCorteMeta}
      />

      <BaseActionModal
        visible={itensVolumeOpen != null}
        title={itensVolumeOpen ? `Itens do volume #${itensVolumeOpen.seqvol}` : 'Itens do volume'}
        onClose={() => setItensVolumeOpen(null)}
        footer={<Button variant="outline" onPress={() => setItensVolumeOpen(null)}>Fechar</Button>}
      >
        {itensVolumeOpen?.loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.listGap}>
            {(itensVolumeOpen?.itens ?? []).map((iv) => (
              <View key={iv.seqitem} style={styles.volumeItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaStrong}>Item {iv.nuitem} · {iv.descrprod}</Text>
                  <Text style={styles.meta}>Qtd: {iv.qtd}</Text>
                </View>
                <Button
                  variant="danger"
                  onPress={() => {
                    if (!itensVolumeOpen) return
                    void removerItemVolume(itensVolumeOpen.seqvol, iv.seqitem)
                  }}
                >
                  Remover
                </Button>
              </View>
            ))}
            {!itensVolumeOpen?.itens.length ? <Text style={styles.meta}>Sem itens neste volume.</Text> : null}
          </View>
        )}
      </BaseActionModal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center' },
  scroll: { padding: space.lg, paddingBottom: space.xl * 2, gap: space.md },
  err: { color: colors.danger },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  metaStrong: { fontSize: 14, color: colors.text, fontWeight: '700' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: space.sm },
  rowBtns: { flexDirection: 'row', gap: space.sm },
  volumeAbertoBox: { marginTop: space.sm, gap: space.sm },
  listGap: { gap: space.sm, marginTop: space.sm },
  volumeRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: space.sm,
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
  },
  volumeItemRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: space.sm,
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
  },
})
