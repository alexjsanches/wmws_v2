import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
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
import { showWmsConfirm, showWmsError, showWmsSuccess } from '../../features/wms/ui/feedback'
import { wmsUiTokens } from '../../features/wms/ui/tokens'
import type { HomeStackParamList } from '../../navigation/types'
import {
  getRecebimentoNotaItens,
  patchRecebimentoItem,
  postRecebimentoConcluir,
  postRecebimentoTarefa,
} from '../../services/wmsApi'
import type { ItemNota } from '../../types/wms'

type Props = NativeStackScreenProps<HomeStackParamList, 'RecebimentoNotaItens'>

export function RecebimentoNotaItensScreen({ navigation, route }: Props) {
  const { nunota, codemp, nutarefa: initialNutarefa } = route.params
  const [nutarefa, setNutarefa] = useState<number | undefined>(initialNutarefa)
  const [items, setItems] = useState<ItemNota[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qtyModal, setQtyModal] = useState<{ item: ItemNota } | null>(null)
  const [qtyText, setQtyText] = useState('')

  const loadItens = useCallback(async () => {
    setError(null)
    try {
      const data = await getRecebimentoNotaItens(nunota)
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
    void loadItens()
  }, [loadItens])

  const criarTarefa = async () => {
    try {
      const { nutarefa: nu } = await postRecebimentoTarefa({ nunota, codemp })
      setNutarefa(nu)
      await loadItens()
    } catch (e) {
      showWmsError('Recebimento', e, 'Erro ao criar tarefa')
    }
  }

  const abrirModalQtd = (item: ItemNota) => {
    if (!nutarefa) {
      Alert.alert('Recebimento', 'Crie a tarefa de recebimento antes de lançar quantidades.')
      return
    }
    setQtyText(
      item.qtdrealizada != null ? String(item.qtdrealizada) : String(item.qtdprevista),
    )
    setQtyModal({ item })
  }

  const salvarQtd = async () => {
    if (!qtyModal || !nutarefa) return
    const q = parseFloat(qtyText.replace(',', '.'))
    if (Number.isNaN(q)) {
      Alert.alert('Recebimento', 'Quantidade inválida.')
      return
    }
    try {
      await patchRecebimentoItem(nutarefa, qtyModal.item.nuitem, { qtdrealizada: q })
      setQtyModal(null)
      await loadItens()
    } catch (e) {
      showWmsError('Recebimento', e, 'Erro ao salvar')
    }
  }

  const concluir = () => {
    if (!nutarefa) {
      Alert.alert('Recebimento', 'Crie a tarefa antes de concluir.')
      return
    }
    showWmsConfirm(
      'Concluir recebimento',
      'Confirma a conclusão desta tarefa? Será gerada a tarefa de armazenagem.',
      async () => {
        try {
          await postRecebimentoConcluir(nutarefa, {})
          showWmsSuccess('Recebimento', 'Tarefa concluída.', () => navigation.goBack())
        } catch (e) {
          showWmsError('Recebimento', e, 'Erro ao concluir')
        }
      },
      { confirmText: 'Concluir' },
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={`NF ${nunota}`} onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={`Recebimento · NF ${nunota}`} onBack={() => navigation.goBack()} />
      {!nutarefa ? (
        <View style={styles.pad}>
          <Text style={styles.hint}>Nenhuma tarefa REC aberta para esta nota.</Text>
          <Button variant="default" onPress={criarTarefa} style={{ marginTop: space.md }}>
            Criar tarefa de recebimento
          </Button>
        </View>
      ) : (
        <View style={styles.rowPad}>
          <Button variant="success" onPress={concluir}>
            Concluir recebimento
          </Button>
        </View>
      )}
      {error ? (
        <View style={styles.pad}>
          <Text style={styles.err}>{error}</Text>
        </View>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.nuitem)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadItens() }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Sem itens retornados.</Text>}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: space.md, padding: space.md }}>
            <Text style={styles.prod}>{item.descrprod}</Text>
            <Text style={styles.meta}>
              Item {item.nuitem} · Qtd prevista {item.qtdprevista}
              {item.qtdrealizada != null ? ` · Conferido ${item.qtdrealizada}` : ''}
            </Text>
            <Text style={styles.meta}>Status: {item.status}</Text>
            <Button variant="outline" onPress={() => abrirModalQtd(item)} style={{ marginTop: space.sm }}>
              Lançar quantidade
            </Button>
          </Card>
        )}
      />
      <Modal visible={qtyModal != null} transparent animationType="fade">
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setQtyModal(null)} />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Quantidade conferida</Text>
            {qtyModal ? (
              <Text style={styles.modalSub} numberOfLines={3}>
                {qtyModal.item.descrprod} · previsto {qtyModal.item.qtdprevista}
              </Text>
            ) : null}
            <Input value={qtyText} onChangeText={setQtyText} keyboardType="decimal-pad" style={{ marginTop: space.md }} />
            <View style={styles.modalBtns}>
              <Button variant="outline" onPress={() => setQtyModal(null)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button variant="default" onPress={() => void salvarQtd()} style={{ flex: 1 }}>
                Salvar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center' },
  pad: { padding: wmsUiTokens.screenPadding },
  rowPad: { paddingHorizontal: wmsUiTokens.screenPadding, paddingBottom: space.sm },
  err: { color: colors.danger },
  list: { padding: wmsUiTokens.screenPadding, paddingBottom: wmsUiTokens.screenBottomPadding },
  empty: { textAlign: 'center', color: colors.textMuted },
  prod: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  hint: { fontSize: 14, color: colors.textMuted },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: space.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: space.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalSub: { fontSize: 14, color: colors.textMuted, marginTop: space.sm },
  modalBtns: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
})
