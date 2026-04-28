import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space } from '@wms/theme'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { CurrentItemCard, TaskProgressoCard } from '../../features/wms/taskExecution/TaskCards'
import { ItemPickerModal, QtyInputModal } from '../../features/wms/taskExecution/TaskModals'
import { buildDivergencias } from '../../features/wms/taskExecution/domain'
import { showWmsError, showWmsSuccess } from '../../features/wms/ui/feedback'
import { useTaskExecutionFlow } from '../../features/wms/taskExecution/useTaskExecutionFlow'
import type { HomeStackParamList } from '../../navigation/types'
import {
  getSeparacaoTarefaItens,
  getSeparacaoTarefaResumo,
  patchSeparacaoItem,
  postSeparacaoConcluir,
} from '../../services/wmsApi'
import type { ItemTarefaWms, SeparacaoTarefaResumo } from '../../types/wms'
import { formatParceiro } from '../../utils/formatParceiro'

type Props = NativeStackScreenProps<HomeStackParamList, 'SeparacaoTarefaItens'>

export function SeparacaoTarefaItensScreen({ navigation, route }: Props) {
  const { nutarefa, nunota, numnota, codonda } = route.params
  const [items, setItems] = useState<ItemTarefaWms[]>([])
  const [resumo, setResumo] = useState<SeparacaoTarefaResumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enderecoModalOpen, setEnderecoModalOpen] = useState(false)
  const [enderecoArea, setEnderecoArea] = useState('')

  const loadItens = useCallback(async () => {
    setError(null)
    try {
      const [data, cab] = await Promise.all([
        getSeparacaoTarefaItens(nutarefa),
        getSeparacaoTarefaResumo(nutarefa).catch(() => null),
      ])
      setItems(data)
      setResumo(cab)
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
      await patchSeparacaoItem(nutarefa, item.nuitem, { qtdrealizada: qtd, controle: item.controle })
      await loadItens()
    } catch (e) {
      showWmsError('Separação', e, 'Erro ao salvar')
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
    taskLabel: 'Separação',
    onApplyQuantidade: aplicarQuantidade,
  })

  const confirmarConclusao = async () => {
    const endereco = enderecoArea.trim()
    if (!endereco) {
      Alert.alert('Separação', 'Informe onde os itens foram deixados para conferência.')
      return
    }
    try {
      await postSeparacaoConcluir(nutarefa, {
        enderecoArea: endereco,
        divergencias: buildDivergencias(items),
      })
      setEnderecoModalOpen(false)
      setEnderecoArea('')
      showWmsSuccess('Separação', 'Tarefa concluída.', () => navigation.goBack())
    } catch (e) {
      showWmsError('Separação', e, 'Erro ao concluir')
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
        title={`Separação · ${numnota ? `NF ${numnota}` : `NUNOTA ${nunota}`} (#${nutarefa}${codonda ? ` · Onda ${codonda}` : ''})`}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadItens() }} />}
      >
        {resumo ? (
          <Card style={{ padding: space.md }}>
            <Text style={styles.metaStrong}>{formatParceiro(resumo.parceiro) || 'Cliente não informado'}</Text>
            <Text style={styles.meta}>
              {resumo.nota?.numnota ? `NF ${resumo.nota.numnota}` : `NUNOTA ${resumo.nota?.nunota ?? nunota}`}
              {resumo.empresa ? ` · ${resumo.empresa}` : ''}
            </Text>
            {resumo.transportador ? <Text style={styles.meta}>Transportador: {resumo.transportador}</Text> : null}
          </Card>
        ) : null}

        <TaskProgressoCard titulo="Progresso da separação" totais={totais} />

        <View style={styles.rowBtns}>
          <Button variant="outline" onPress={() => setListaModalOpen(true)} style={{ flex: 1 }}>
            Abrir lista de itens
          </Button>
          <Button variant="success" onPress={() => setEnderecoModalOpen(true)} style={{ flex: 1 }}>
            Concluir tarefa
          </Button>
        </View>

        {error ? <Text style={styles.err}>{error}</Text> : null}

        <CurrentItemCard
          item={itemAtual}
          primaryActionLabel="Achou tudo"
          secondaryActionLabel="Informar quantidade"
          actionLoading={isApplying}
          onPrimaryAction={(item) => marcarAchouTudo(item)}
          onSecondaryAction={(item) => abrirModalQtd(item)}
        />
      </ScrollView>

      <ItemPickerModal
        visible={listaModalOpen}
        items={itensOrdenados}
        onPick={escolherItem}
        onClose={() => setListaModalOpen(false)}
      />

      <Modal visible={enderecoModalOpen} transparent animationType="fade">
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEnderecoModalOpen(false)} />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Finalizar separação</Text>
            <Text style={styles.modalSub}>Informe onde os itens foram deixados para conferência.</Text>
            <Input
              value={enderecoArea}
              onChangeText={setEnderecoArea}
              placeholder="Ex: A3, chão próximo da doca 2"
              style={{ marginTop: space.md }}
            />
            <View style={styles.modalBtns}>
              <Button variant="outline" onPress={() => setEnderecoModalOpen(false)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button variant="success" onPress={() => void confirmarConclusao()} style={{ flex: 1 }}>
                Confirmar
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <QtyInputModal
        visible={qtyModal != null}
        item={qtyModal?.item ?? null}
        value={qtyText}
        onChange={setQtyText}
        title="Quantidade separada"
        loading={isApplying}
        onCancel={() => setQtyModal(null)}
        onConfirm={() => void salvarQtd()}
      />
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
  rowBtns: { flexDirection: 'row', gap: space.sm },
  modalRoot: { flex: 1, justifyContent: 'center', padding: space.lg },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalBox: { backgroundColor: colors.surface, borderRadius: 16, padding: space.lg },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalSub: { fontSize: 14, color: colors.textMuted, marginTop: space.sm },
  modalBtns: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
})
