import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space } from '@wms/theme'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { useAuth } from '../../context/AuthContext'
import { showWmsConfirm, showWmsError, showWmsSuccess } from '../../features/wms/ui/feedback'
import type { HomeStackParamList } from '../../navigation/types'
import {
  getConferenciaPedidosPendentes,
  getConferenciaTarefasPendentes,
  postWmsTarefaAtribuir,
  postWmsTarefaDesatribuir,
} from '../../services/wmsApi'
import type { OrdemWmsCab, TarefaWmsLista } from '../../types/wms'
import { formatDisplayValue } from '../../utils/formatDisplayValue'
import { formatParceiro } from '../../utils/formatParceiro'
import { getCodUsu } from '../../utils/getCodUsu'

type Props = NativeStackScreenProps<HomeStackParamList, 'ConferenciaLista'>

export function ConferenciaListaScreen({ navigation }: Props) {
  const { user } = useAuth()
  const codusuAtual = getCodUsu(user)
  const [pedidos, setPedidos] = useState<OrdemWmsCab[]>([])
  const [tarefas, setTarefas] = useState<TarefaWmsLista[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [p, t] = await Promise.all([getConferenciaPedidosPendentes(), getConferenciaTarefasPendentes()])
      setPedidos(p)
      setTarefas(t)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
      setPedidos([])
      setTarefas([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const atribuirTarefa = async (nutarefa: number) => {
    if (!codusuAtual) {
      showWmsError('Conferência', new Error('Usuário sem CODUSU no perfil.'), 'Não foi possível identificar o usuário.')
      return
    }
    try {
      await postWmsTarefaAtribuir(nutarefa, { codusu: codusuAtual })
      showWmsSuccess('Conferência', `Tarefa #${nutarefa} atribuída a você.`)
      await load()
    } catch (e) {
      showWmsError('Conferência', e, 'Erro ao atribuir tarefa.')
    }
  }

  const desatribuirTarefa = async (nutarefa: number) => {
    try {
      await postWmsTarefaDesatribuir(nutarefa)
      showWmsSuccess('Conferência', `Tarefa #${nutarefa} desatribuída.`)
      await load()
    } catch (e) {
      showWmsError('Conferência', e, 'Erro ao desatribuir tarefa.')
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Conferência" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Conferência" onBack={() => navigation.goBack()} />
      {error ? (
        <View style={styles.pad}>
          <Text style={styles.err}>{error}</Text>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} />}
      >
        <Text style={styles.section}>Pedidos sem tarefa</Text>
        <Text style={styles.hint}>Pedidos com AD_AGUARDCONFER e ainda sem tarefa CON.</Text>
        {pedidos.length === 0 ? (
          <Text style={styles.empty}>Nenhum pedido nesta fila.</Text>
        ) : (
          pedidos.map((o) => (
            <Card
              key={`p-${o.nunota}-${o.codemp}`}
              onPress={() =>
                navigation.navigate('ConferenciaPedidoItens', {
                  nunota: o.nunota,
                  codemp: o.codemp,
                  numnota: o.numnota,
                })
              }
              style={{ marginBottom: space.md, padding: space.lg }}
            >
              <Text style={styles.title}>NF {o.numnota}</Text>
              <Text style={styles.sub}>{formatParceiro(o.parceiro)}</Text>
              <Text style={styles.meta}>
                {formatDisplayValue(o.nomeemp)} · empresa {o.codemp}
              </Text>
            </Card>
          ))
        )}

        <Text style={[styles.section, { marginTop: space.xl }]}>Tarefas em aberto</Text>
        <Text style={styles.hint}>Tarefas CON já criadas.</Text>
        {tarefas.length === 0 ? (
          <Text style={styles.empty}>Nenhuma tarefa pendente.</Text>
        ) : (
          tarefas.map((t) => (
            <Card
              key={`t-${t.nutarefa}`}
              onPress={() => {
                const atribuidaParaOutro = t.codusuAtrib > 0 && t.codusuAtrib !== codusuAtual
                if (atribuidaParaOutro) {
                  showWmsError('Conferência', new Error(`Tarefa atribuída ao usuário ${t.codusuAtrib}.`), 'Tarefa atribuída a outro usuário.')
                  return
                }
                navigation.navigate('ConferenciaTarefaItens', {
                  nutarefa: t.nutarefa,
                  nunota: t.nunota,
                  numnota: t.numnota,
                  codonda: t.codonda,
                })
              }}
              style={{ marginBottom: space.md, padding: space.lg }}
            >
              <Text style={styles.title}>
                Tarefa #{t.nutarefa}
                {t.codonda ? ` · Onda ${t.codonda}` : ''}
              </Text>
              <Text style={styles.sub}>NF {t.numnota} · {formatParceiro(t.parceiro)}</Text>
              <Text style={styles.meta}>
                {t.itensPendentes}/{t.totalItens} itens pendentes · emp. {t.codemp}
              </Text>
              <Text style={styles.meta}>
                {t.codusuAtrib > 0
                  ? `Atribuída para usuário ${t.codusuAtrib}${t.dthatrib ? ` em ${t.dthatrib}` : ''}`
                  : 'Sem atribuição'}
              </Text>
              <Text style={styles.meta}>Gestor: {t.codusuGer > 0 ? t.codusuGer : 'não definido'}</Text>
              <View style={styles.rowBtns}>
                {t.codusuAtrib === 0 ? (
                  <Button variant="outline" onPress={() => void atribuirTarefa(t.nutarefa)}>
                    Atribuir para mim
                  </Button>
                ) : null}
                {t.codusuAtrib > 0 && t.codusuAtrib === codusuAtual ? (
                  <Button
                    variant="danger"
                    onPress={() =>
                      showWmsConfirm(
                        'Conferência',
                        `Desatribuir tarefa #${t.nutarefa}?`,
                        () => {
                          void desatribuirTarefa(t.nutarefa)
                        },
                      )
                    }
                  >
                    Desatribuir
                  </Button>
                ) : null}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center' },
  pad: { padding: space.lg },
  err: { color: colors.danger, fontSize: 14 },
  scroll: { padding: space.lg, paddingBottom: space.xl * 2 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: space.xs },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: space.md, lineHeight: 18 },
  empty: { textAlign: 'center', color: colors.textMuted, marginBottom: space.lg },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  rowBtns: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
})
