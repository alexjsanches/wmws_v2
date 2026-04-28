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
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { showWmsError, showWmsSuccess } from '../../features/wms/ui/feedback'
import type { HomeStackParamList } from '../../navigation/types'
import { getSeparacaoItensOrdem, postSeparacaoTarefa } from '../../services/wmsApi'
import type { ItemTarefaWms } from '../../types/wms'

type Props = NativeStackScreenProps<HomeStackParamList, 'SeparacaoOrdemItens'>

export function SeparacaoOrdemItensScreen({ navigation, route }: Props) {
  const { nunota, codemp, numnota } = route.params
  const [items, setItems] = useState<ItemTarefaWms[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [criando, setCriando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await getSeparacaoItensOrdem(nunota)
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
      setItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [nunota])

  useEffect(() => {
    void load()
  }, [load])

  const iniciar = async () => {
    setCriando(true)
    try {
      const res = await postSeparacaoTarefa({ nunota, codemp })
      const msg = res.existente ? 'Já existia tarefa SEP — abrindo.' : 'Tarefa criada.'
      showWmsSuccess('Separação', msg, () =>
        navigation.replace('SeparacaoTarefaItens', {
          nutarefa: res.nutarefa,
          nunota,
          numnota,
          codonda: res.codonda,
        }),
      )
    } catch (e) {
      showWmsError('Separação', e, 'Erro ao criar tarefa')
    } finally {
      setCriando(false)
    }
  }

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
        <Button variant="default" onPress={() => void iniciar()} disabled={criando}>
          {criando ? 'A criar…' : 'Iniciar tarefa de separação'}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} />}
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
