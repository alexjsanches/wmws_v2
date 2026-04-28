import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space } from '@wms/theme'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ConferenciaFechamentoModal } from '../../features/wms/conferencia/ConferenciaFechamentoModal'
import { useConferenciaTaskScreen } from '../../features/wms/conferencia/useConferenciaTaskScreen'
import { CurrentItemCard, TaskProgressoCard } from '../../features/wms/taskExecution/TaskCards'
import { ItemPickerModal, QtyInputModal } from '../../features/wms/taskExecution/TaskModals'
import { BaseActionModal } from '../../features/wms/ui/BaseActionModal'
import type { HomeStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<HomeStackParamList, 'ConferenciaTarefaItens'>

export function ConferenciaTarefaItensScreen({ navigation, route }: Props) {
  const { nutarefa, nunota, numnota, codonda } = route.params
  const {
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
  } = useConferenciaTaskScreen({ nutarefa, onConcluded: () => navigation.goBack() })

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void reload() }} />}
      >
        <TaskProgressoCard titulo="Progresso da conferência" totais={flow.totais} />

        <Card>
          <Text style={styles.cardTitle}>Modo de conferência</Text>
          <View style={styles.rowBtns}>
            <Button
              variant={volumes.modo === 'simples' ? 'primary' : 'outline'}
              onPress={() => volumes.setModo('simples')}
              style={{ flex: 1 }}
            >
              Simples
            </Button>
            <Button
              variant={volumes.modo === 'detalhado' ? 'primary' : 'outline'}
              onPress={() => volumes.setModo('detalhado')}
              style={{ flex: 1 }}
            >
              Detalhado por volume
            </Button>
          </View>
          <Text style={styles.meta}>
            {volumes.modo === 'simples'
              ? 'Finaliza conferência só com totais no fechamento.'
              : 'Permite abrir volumes/caixas e alocar itens durante a conferência.'}
          </Text>
        </Card>

        {volumes.modo === 'detalhado' ? (
          <Card>
            <Text style={styles.cardTitle}>Volumes da conferência</Text>
            {volumes.loadingVolumes ? <ActivityIndicator color={colors.primary} /> : null}
            <Text style={styles.metaStrong}>
              Resumo: {volumes.resumo?.qtdVolumes ?? 0} volumes | {volumes.resumo?.volumesAbertos ?? 0} abertos | {volumes.resumo?.qtdItensVolume ?? 0} itens
            </Text>
            <View style={styles.rowBtns}>
              <Button variant="outline" onPress={() => void volumes.loadVolumes()} style={{ flex: 1 }}>
                Atualizar
              </Button>
              <Button
                onPress={() => {
                  void volumes.abrirVolume(obsNovoVolume.trim() || undefined)
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
            {(() => {
              const volumeAberto = volumes.volumeAberto
              if (!volumeAberto) {
                return <Text style={styles.meta}>Nenhum volume aberto no momento.</Text>
              }
              return (
                <View style={styles.volumeAbertoBox}>
                  <Text style={styles.metaStrong}>Volume aberto: #{volumeAberto.seqvol}</Text>
                  <View style={styles.rowBtns}>
                    <Button variant="outline" onPress={() => void volumes.abrirItensVolume(volumeAberto.seqvol)} style={{ flex: 1 }}>
                      Ver itens
                    </Button>
                    <Button variant="danger" onPress={() => void volumes.fecharVolume(volumeAberto.seqvol)} style={{ flex: 1 }}>
                      Fechar volume
                    </Button>
                  </View>
                </View>
              )
            })()}
            <View style={styles.listGap}>
              {volumes.volumes.map((v) => (
                <View key={v.seqvol} style={styles.volumeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaStrong}>Volume #{v.seqvol} ({v.status})</Text>
                    <Text style={styles.meta}>Itens: {v.qtditens ?? 0} | Ordem: {v.ordem}</Text>
                  </View>
                  <Button variant="outline" onPress={() => void volumes.abrirItensVolume(v.seqvol)}>
                    Itens
                  </Button>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <View style={styles.rowBtns}>
          <Button variant="outline" onPress={() => flow.setListaModalOpen(true)} style={{ flex: 1 }}>
            Abrir lista de itens
          </Button>
          <Button variant="success" onPress={() => fechamento.setFechamentoModalOpen(true)} style={{ flex: 1 }}>
            Concluir tarefa
          </Button>
        </View>

        {error ? <Text style={styles.err}>{error}</Text> : null}

        <CurrentItemCard
          item={flow.itemAtual}
          primaryActionLabel="Conferir total"
          secondaryActionLabel="Informar quantidade"
          actionLoading={flow.isApplying}
          onPrimaryAction={(item) => flow.marcarAchouTudo(item)}
          onSecondaryAction={(item) => flow.abrirModalQtd(item)}
        />

        {volumes.modo === 'detalhado' ? (
          <Card>
            <Text style={styles.cardTitle}>Alocar item atual no volume aberto</Text>
            <Input
              value={qtdVolumeText}
              onChangeText={setQtdVolumeText}
              placeholder="Ex.: 1"
              keyboardType="decimal-pad"
            />
            <Button
              disabled={!flow.itemAtual || !volumes.volumeAberto}
              onPress={addCurrentItemToVolume}
            >
              Adicionar item atual
            </Button>
            <Text style={styles.meta}>{volumes.volumeAberto ? `Volume destino: #${volumes.volumeAberto.seqvol}` : 'Abra um volume para começar.'}</Text>
          </Card>
        ) : null}
      </ScrollView>

      <ItemPickerModal
        visible={flow.listaModalOpen}
        items={flow.itensOrdenados}
        onPick={flow.escolherItem}
        onClose={() => flow.setListaModalOpen(false)}
      />

      <QtyInputModal
        visible={flow.qtyModal != null}
        item={flow.qtyModal?.item ?? null}
        value={flow.qtyText}
        onChange={flow.setQtyText}
        title="Quantidade conferida"
        loading={flow.isApplying}
        onCancel={() => flow.setQtyModal(null)}
        onConfirm={() => void flow.salvarQtd()}
      />

      <ConferenciaFechamentoModal
        visible={fechamento.fechamentoModalOpen}
        onClose={() => fechamento.setFechamentoModalOpen(false)}
        onConfirm={() => void concludeTask()}
        enderecoExpedicao={fechamento.enderecoExpedicao}
        setEnderecoExpedicao={fechamento.setEnderecoExpedicao}
        pesoBruto={fechamento.pesoBruto}
        setPesoBruto={fechamento.setPesoBruto}
        volumes={fechamento.volumes}
        setVolumes={fechamento.setVolumes}
        altura={fechamento.altura}
        setAltura={fechamento.setAltura}
        largura={fechamento.largura}
        setLargura={fechamento.setLargura}
        profundidade={fechamento.profundidade}
        setProfundidade={fechamento.setProfundidade}
        divergenciasBase={fechamento.divergenciasBase}
        divergenciaMeta={fechamento.divergenciaMeta}
        setDivergenciaMeta={fechamento.setDivergenciaMeta}
        corteMeta={fechamento.corteMeta}
        setCorteMeta={fechamento.setCorteMeta}
      />

      <BaseActionModal
        visible={volumes.itensVolumeOpen != null}
        title={volumes.itensVolumeOpen ? `Itens do volume #${volumes.itensVolumeOpen.seqvol}` : 'Itens do volume'}
        onClose={() => volumes.setItensVolumeOpen(null)}
        footer={<Button variant="outline" onPress={() => volumes.setItensVolumeOpen(null)}>Fechar</Button>}
      >
        {volumes.itensVolumeOpen?.loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.listGap}>
            {(volumes.itensVolumeOpen?.itens ?? []).map((iv) => (
              <View key={iv.seqitem} style={styles.volumeItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaStrong}>Item {iv.nuitem} · {iv.descrprod}</Text>
                  <Text style={styles.meta}>Qtd: {iv.qtd}</Text>
                </View>
                <Button
                  variant="danger"
                  onPress={() => {
                    if (!volumes.itensVolumeOpen) return
                    void volumes.removerItemVolume(volumes.itensVolumeOpen.seqvol, iv.seqitem)
                  }}
                >
                  Remover
                </Button>
              </View>
            ))}
            {!volumes.itensVolumeOpen?.itens.length ? <Text style={styles.meta}>Sem itens neste volume.</Text> : null}
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
