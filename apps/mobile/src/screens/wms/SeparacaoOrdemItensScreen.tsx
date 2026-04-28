import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space } from '@wms/theme'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { usePedidoTaskBootstrap } from '../../features/wms/taskExecution/usePedidoTaskBootstrap'
import type { HomeStackParamList } from '../../navigation/types'
import { getSeparacaoItensOrdem, postSeparacaoTarefa } from '../../services/wmsApi'

type Props = NativeStackScreenProps<HomeStackParamList, 'SeparacaoOrdemItens'>

export function SeparacaoOrdemItensScreen({ navigation, route }: Props) {
  const { nunota, codemp, numnota } = route.params
  const { items, loading, refreshing, isStarting, error, setRefreshing, reload, startTaskFlow } = usePedidoTaskBootstrap({
    nunota,
    codemp,
    taskLabel: 'Separação',
    loadItems: getSeparacaoItensOrdem,
    startTask: postSeparacaoTarefa,
    onTaskOpened: ({ nutarefa, codonda }) =>
        navigation.replace('SeparacaoTarefaItens', {
          nutarefa,
          nunota,
          numnota,
          codonda: codonda ?? undefined,
        }),
  })

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={`NF ${numnota ?? nunota}`} onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={`Separação · NF ${numnota ?? nunota}`} onBack={() => navigation.goBack()} />
      <View style={styles.rowPad}>
        <Button variant="default" onPress={() => void startTaskFlow()} disabled={isStarting}>
          {isStarting ? 'A criar…' : 'Iniciar tarefa de separação'}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void reload() }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Sem itens na ordem.</Text>}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: space.md, padding: space.md }}>
            <Text style={styles.prod}>{item.descrprod}</Text>
            <Text style={styles.meta}>
              Item {item.nuitem} · Prev. {item.qtdprevista} {item.codvol ? `· ${item.codvol}` : ''}
            </Text>
          </Card>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center' },
  pad: { padding: space.lg },
  rowPad: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  err: { color: colors.danger },
  list: { padding: space.lg, paddingBottom: space.xl * 2 },
  empty: { textAlign: 'center', color: colors.textMuted },
  prod: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
})
