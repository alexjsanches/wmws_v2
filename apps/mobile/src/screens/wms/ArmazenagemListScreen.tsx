import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useState } from 'react'
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
import { Card } from '../../components/ui/Card'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import type { HomeStackParamList } from '../../navigation/types'
import { getArmazenagemTarefasPendentes } from '../../services/wmsApi'
import type { TarefaResumo } from '../../types/wms'
import { formatParceiro } from '../../utils/formatParceiro'

type Props = NativeStackScreenProps<HomeStackParamList, 'ArmazenagemLista'>

export function ArmazenagemListScreen({ navigation }: Props) {
  const [items, setItems] = useState<TarefaResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await getArmazenagemTarefasPendentes()
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
      setItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Armazenagem" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Armazenagem" onBack={() => navigation.goBack()} />
      {error ? (
        <View style={styles.pad}>
          <Text style={styles.err}>{error}</Text>
        </View>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(item, i) => `${item.nutarefa}-${i}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma tarefa de armazenagem pendente.</Text>
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => navigation.navigate('ArmazenagemTarefaItens', { nutarefa: item.nutarefa })}
            style={{ marginBottom: space.md, padding: space.lg }}
          >
            <Text style={styles.title}>Tarefa #{item.nutarefa}</Text>
            <Text style={styles.sub}>NF {item.numnota} · {formatParceiro(item.parceiro)}</Text>
            <Text style={styles.meta}>
              {item.itens_pendentes}/{item.total_itens} itens pendentes
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
  err: { color: colors.danger, fontSize: 14 },
  list: { padding: space.lg, paddingBottom: space.xl * 2 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: space.xl },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
})
