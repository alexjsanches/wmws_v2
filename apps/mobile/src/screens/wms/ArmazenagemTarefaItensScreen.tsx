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
import { colors, radii, space } from '@wms/theme'
import { isDomainError } from '../../application/DomainError'
import {
  concludeArmazenagemTaskUseCase,
  loadArmazenagemTaskItemsUseCase,
  saveArmazenagemItemUseCase,
} from '../../application/use-cases'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { showWmsConfirm, showWmsError, showWmsSuccess } from '../../features/wms/ui/feedback'
import { wmsUiTokens } from '../../features/wms/ui/tokens'
import type { HomeStackParamList } from '../../navigation/types'
import type { ItemArmazenagem } from '../../types/wms'

type Props = NativeStackScreenProps<HomeStackParamList, 'ArmazenagemTarefaItens'>

export function ArmazenagemTarefaItensScreen({ navigation, route }: Props) {
  const { nutarefa } = route.params
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

  const abrirModal = (item: ItemArmazenagem) => {
    setQtd(item.qtdrealizada != null ? String(item.qtdrealizada) : String(item.qtdprevista))
    setLocalLivre(item.local_livre ?? '')
    setModal({ item })
  }

  const salvarItem = async () => {
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
  }

  const concluir = () => {
    showWmsConfirm(
      'Concluir armazenagem',
      'Confirma a conclusão desta tarefa?',
      async () => {
        try {
          await concludeArmazenagemTaskUseCase(nutarefa)
          showWmsSuccess('Armazenagem', 'Tarefa concluída.', () => navigation.goBack())
        } catch (e) {
          showWmsError('Armazenagem', e, 'Erro ao concluir')
        }
      },
      { confirmText: 'Concluir' },
    )
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
      <ScreenHeader title={`Armazenagem · #${nutarefa}`} onBack={() => navigation.goBack()} />
      <View style={styles.rowPad}>
        <Button variant="success" onPress={concluir}>
          Concluir armazenagem
        </Button>
      </View>
      {error ? (
        <View style={styles.pad}>
          <Text style={styles.err}>{error}</Text>
        </View>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.nuitem)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Sem itens.</Text>}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: space.md, padding: space.md }}>
            <View style={styles.rowTop}>
              <Text style={styles.prod}>{item.descrprod}</Text>
              {item.cross_docking ? <Badge tone="warning">Cross-docking</Badge> : null}
            </View>
            <Text style={styles.meta}>
              Item {item.nuitem} · previsto {item.qtdprevista}
              {item.qtdrealizada != null ? ` · guardado ${item.qtdrealizada}` : ''}
            </Text>
            <Button variant="outline" onPress={() => abrirModal(item)} style={{ marginTop: space.sm }}>
              Registrar guarda
            </Button>
          </Card>
        )}
      />
      <Modal visible={modal != null} transparent animationType="fade">
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModal(null)} />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Registrar armazenagem</Text>
            {modal ? <Text style={styles.modalSub}>{modal.item.descrprod}</Text> : null}
            <Text style={styles.lbl}>Quantidade</Text>
            <Input value={qtd} onChangeText={setQtd} keyboardType="decimal-pad" />
            <Text style={[styles.lbl, { marginTop: space.md }]}>Local livre (opcional)</Text>
            <Input
              value={localLivre}
              onChangeText={setLocalLivre}
              placeholder="Ex.: doca, área de conferência"
            />
            <View style={styles.modalBtns}>
              <Button variant="outline" onPress={() => setModal(null)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button variant="default" onPress={() => void salvarItem()} style={{ flex: 1 }}>
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
  rowPad: { paddingHorizontal: wmsUiTokens.screenPadding, paddingBottom: space.sm },
  pad: { padding: wmsUiTokens.screenPadding },
  err: { color: colors.danger },
  list: { padding: wmsUiTokens.screenPadding, paddingBottom: wmsUiTokens.screenBottomPadding },
  empty: { textAlign: 'center', color: colors.textMuted },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.sm },
  prod: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
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
    borderRadius: radii.lg,
    padding: space.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalSub: { fontSize: 14, color: colors.textMuted, marginTop: space.sm },
  lbl: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  modalBtns: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
})
