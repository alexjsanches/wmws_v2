import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import {
  ActivityIndicator,
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
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { useArmazenagemTaskItems } from '../../features/wms/armazenagem/useArmazenagemTaskItems'
import { wmsUiTokens } from '../../features/wms/ui/tokens'
import type { HomeStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<HomeStackParamList, 'ArmazenagemTarefaItens'>

export function ArmazenagemTarefaItensScreen({ navigation, route }: Props) {
  const { nutarefa } = route.params
  const {
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
    reload,
    openModal,
    saveItem,
    concludeTask,
  } = useArmazenagemTaskItems({ nutarefa, onConcluded: () => navigation.goBack() })

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
        <Button variant="success" onPress={concludeTask}>
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
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void reload() }} />
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
            <Button variant="outline" onPress={() => openModal(item)} style={{ marginTop: space.sm }}>
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
              <Button variant="default" onPress={() => void saveItem()} style={{ flex: 1 }}>
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
