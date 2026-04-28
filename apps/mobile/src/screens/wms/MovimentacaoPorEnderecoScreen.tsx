import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radii, space } from '@wms/theme'
import { useAuth } from '../../context/AuthContext'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { EtiquetaPrintModal } from '../../features/wms/ui/EtiquetaPrintModal'
import { showWmsConfirm, showWmsError, showWmsSuccess } from '../../features/wms/ui/feedback'
import { wmsUiTokens } from '../../features/wms/ui/tokens'
import type { HomeStackParamList } from '../../navigation/types'
import { AGENTE_ID_IMPRESSAO, IMPRESSORA_LOGICO, postImprimir } from '../../services/impressaoApi'
import type { HistoricoEnderecoProduto, ProdutoEndereco } from '../../types/movimentacaoProativa'
import {
  getMpVerificarDesaparecimento,
  postMpHistoricoEnderecos,
  postMpLogMovimentacao,
  postMpProdutosPorEndereco,
  postMpRegistrarMovimentacao,
  putMpEnderecoCadastroProduto,
} from '../../services/movimentacaoProativaApi'
import { formatarEndereco, parseEnderecoLocal, validarEnderecoCompleto } from '../../utils/formatarEndereco'
import { getCodUsu } from '../../utils/getCodUsu'

type Props = NativeStackScreenProps<HomeStackParamList, 'MovimentacaoPorEndereco'>

type ProdutoComFlag = ProdutoEndereco & { desaparecido: boolean }

export function MovimentacaoPorEnderecoScreen({ navigation, route }: Props) {
  const { codemp } = route.params
  const { user } = useAuth()
  const codusu = getCodUsu(user)

  const [endereco, setEndereco] = useState('')
  const [enderecoAtual, setEnderecoAtual] = useState('')
  const [loading, setLoading] = useState(false)
  const [produtos, setProdutos] = useState<ProdutoComFlag[]>([])
  const [aba, setAba] = useState<'todos' | 'normais' | 'desaparecidos'>('todos')

  const [modalMover, setModalMover] = useState<ProdutoEndereco | null>(null)
  const [novoEndereco, setNovoEndereco] = useState('')
  const [printProduto, setPrintProduto] = useState<ProdutoEndereco | null>(null)
  const [printLoteEnderecoOpen, setPrintLoteEnderecoOpen] = useState(false)

  const [modalHistorico, setModalHistorico] = useState<{
    produto: ProdutoEndereco
    itens: HistoricoEnderecoProduto[]
    loading: boolean
  } | null>(null)

  const onEndChange = useCallback((t: string) => {
    setEndereco(formatarEndereco(t))
  }, [])

  const buscar = async () => {
    const end = formatarEndereco(endereco).trim()
    if (!validarEnderecoCompleto(end)) {
      Alert.alert('Endereço', 'Informe o endereço no formato Módulo.Rua.Prédio.Nível (ex.: 01.21.08.004).')
      return
    }
    setLoading(true)
    try {
      const lista = await postMpProdutosPorEndereco({ endereco: end, codemp })
      if (lista.length === 0) {
        Alert.alert('Busca', 'Nenhum produto com estoque neste endereço.')
        setProdutos([])
        setEnderecoAtual('')
        return
      }
      const comFlag: ProdutoComFlag[] = await Promise.all(
        lista.map(async (p) => {
          const st = await getMpVerificarDesaparecimento(p.codprod)
          return { ...p, desaparecido: st.desaparecido }
        }),
      )
      setEnderecoAtual(end)
      setProdutos(comFlag)
      Alert.alert('Busca', `${comFlag.length} produto(s) encontrado(s).`)
    } catch (e) {
      showWmsError('Busca', e, 'Erro ao buscar.')
      setProdutos([])
    } finally {
      setLoading(false)
    }
  }

  const limpar = () => {
    setEndereco('')
    setEnderecoAtual('')
    setProdutos([])
  }

  const abrirHistorico = async (p: ProdutoEndereco) => {
    setModalHistorico({ produto: p, itens: [], loading: true })
    try {
      const itens = await postMpHistoricoEnderecos({ codprod: p.codprod, codemp })
      setModalHistorico({ produto: p, itens, loading: false })
    } catch (e) {
      setModalHistorico(null)
      showWmsError('Histórico', e, 'Erro ao carregar.')
    }
  }

  const confirmarDesaparecimento = (p: ProdutoEndereco) => {
    if (!codusu) {
      Alert.alert('Movimentação', 'Perfil sem CODUSU — não é possível registrar o log.')
      return
    }
    showWmsConfirm(
      'Produto não encontrado',
      `Confirmar que o produto ${p.codprod} não está fisicamente em ${enderecoAtual}?`,
      async () => {
        try {
          setLoading(true)
          await postMpLogMovimentacao({
            codusu,
            endlido: enderecoAtual,
            endcadastro: p.enderecoCadastro,
            acao: `Produto não encontrado no endereço ${enderecoAtual} (desaparecimento)`,
            codprod: p.codprod,
            controle: p.controle || ' ',
            desaparecido: 'S',
          })
          setProdutos((prev) => prev.map((x) => (x.codprod === p.codprod ? { ...x, desaparecido: true } : x)))
          showWmsSuccess('Registrado', 'Desaparecimento registrado.')
        } catch (e) {
          showWmsError('Erro', e, 'Falha ao registrar.')
        } finally {
          setLoading(false)
        }
      },
      { destructive: true },
    )
  }

  const confirmarMover = async () => {
    if (!codusu) {
      Alert.alert('Movimentação', 'Perfil sem CODUSU — não é possível registrar o log.')
      return
    }
    const p = modalMover
    if (!p) return
    const end = formatarEndereco(novoEndereco).trim()
    if (!validarEnderecoCompleto(end)) {
      Alert.alert('Endereço', 'Novo endereço inválido.')
      return
    }
    const partes = parseEnderecoLocal(end)
    if (!partes) {
      Alert.alert('Endereço', 'Não foi possível interpretar o endereço.')
      return
    }
    setLoading(true)
    try {
      await putMpEnderecoCadastroProduto({
        codprod: p.codprod,
        modulo: partes.modulo,
        rua: partes.rua,
        predio: partes.predio,
        nivel: partes.nivel,
      })
      await postMpLogMovimentacao({
        codusu,
        endlido: enderecoAtual,
        endcadastro: end,
        acao: `Moveu produto de ${enderecoAtual} para ${end}`,
        codprod: p.codprod,
        controle: p.controle || ' ',
        desaparecido: 'N',
      })
      const primeira = await postMpRegistrarMovimentacao({
        codemp,
        codprod: p.codprod,
        codvol: p.codvol || undefined,
        qtd: 1,
        enderecoOrigem: enderecoAtual,
        enderecoDestino: end,
        qtdMovimentada: 1,
        acao: 'atualizarCadastroPorEndereco',
      })
      if (!primeira.success && 'requireConfirmation' in primeira && primeira.requireConfirmation) {
        const avisos = primeira.policy.warnings.length
          ? primeira.policy.warnings.map((w) => `- ${w}`).join('\n')
          : primeira.message
        const confirmou = await new Promise<boolean>((resolve) => {
          Alert.alert('Confirmação de política', avisos || 'Movimentação exige confirmação.', [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            {
              text: 'Confirmar e seguir',
              onPress: () => {
                void (async () => {
                  const segunda = await postMpRegistrarMovimentacao({
                    codemp,
                    codprod: p.codprod,
                    codvol: p.codvol || undefined,
                    qtd: 1,
                    enderecoOrigem: enderecoAtual,
                    enderecoDestino: end,
                    qtdMovimentada: 1,
                    acao: 'atualizarCadastroPorEndereco',
                    confirmarComAlerta: true,
                  })
                  if (!segunda.success) {
                    throw new Error(segunda.policy.errors.join('\n') || segunda.message || 'Movimentação bloqueada.')
                  }
                  resolve(true)
                })().catch((e) => {
                  showWmsError('Movimentação', e, 'Erro ao confirmar movimentação.')
                  resolve(false)
                })
              },
            },
          ])
        })
        if (!confirmou) return
      } else if (!primeira.success) {
        throw new Error(primeira.policy.errors.join('\n') || primeira.message || 'Movimentação bloqueada.')
      }
      setProdutos((prev) => prev.filter((x) => x.codprod !== p.codprod))
      setModalMover(null)
      setNovoEndereco('')
      showWmsSuccess('Sucesso', 'Endereço de cadastro atualizado e log gravado.')
    } catch (e) {
      showWmsError('Erro', e, 'Falha ao mover.')
    } finally {
      setLoading(false)
    }
  }

  const filtrados = produtos.filter((x) => {
    if (aba === 'normais') return !x.desaparecido
    if (aba === 'desaparecidos') return x.desaparecido
    return true
  })

  const fmtHist = (d: Date | null, raw?: string) => {
    if (!d || Number.isNaN(d.getTime())) return raw?.trim() ? raw : 'Data inválida'
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Por endereço" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={64}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card style={{ padding: space.lg, gap: space.md }}>
            <Text style={styles.cardTitle}>Buscar produtos</Text>
            <Text style={styles.muted}>Empresa {codemp} · formato 00.00.00.000</Text>
            <Input
              value={endereco}
              onChangeText={onEndChange}
              placeholder="Ex.: 01.21.08.004"
              autoCapitalize="none"
              onSubmitEditing={() => void buscar()}
            />
            <View style={styles.rowBtns}>
              <Button variant="outline" onPress={limpar} disabled={loading} style={{ flex: 1 }}>
                Limpar
              </Button>
              <Button
                variant="default"
                onPress={() => void buscar()}
                disabled={loading || !validarEnderecoCompleto(formatarEndereco(endereco).trim())}
                style={{ flex: 1 }}
              >
                {loading ? 'Buscando…' : 'Buscar'}
              </Button>
            </View>
          </Card>

          {produtos.length > 0 ? (
            <Card style={{ padding: space.sm, marginTop: space.md }}>
              <View style={styles.tabs}>
                {(
                  [
                    ['todos', `Todos (${produtos.length})`],
                    ['normais', `Normais (${produtos.filter((p) => !p.desaparecido).length})`],
                    ['desaparecidos', `Desap. (${produtos.filter((p) => p.desaparecido).length})`],
                  ] as const
                ).map(([key, label]) => (
                  <Pressable
                    key={key}
                    onPress={() => setAba(key)}
                    style={[styles.tab, aba === key && styles.tabOn]}
                  >
                    <Text style={[styles.tabTxt, aba === key && styles.tabTxtOn]} numberOfLines={1}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}

          {enderecoAtual ? (
            <Text style={styles.subLoc}>
              Endereço lido: <Text style={{ fontWeight: '800' }}>{enderecoAtual}</Text>
            </Text>
          ) : null}

          {filtrados.map((p) => (
            <Card key={p.codprod} style={{ padding: space.lg, marginTop: space.md, gap: space.sm }}>
              <View style={styles.rowTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cod}>Cód. {p.codprod}</Text>
                  <Text style={styles.desc}>{p.descrprod}</Text>
                </View>
                {p.desaparecido ? (
                  <Badge tone="danger">Desaparecido</Badge>
                ) : p.qtdestoque > 0 ? (
                  <Badge tone="success">Estq. {p.qtdestoque}</Badge>
                ) : null}
              </View>
              <Text style={styles.meta}>Marca: {p.marca || '—'}</Text>
              <Text style={styles.meta}>Ref. forn.: {p.refforn || '—'}</Text>
              {p.referencia ? <Text style={styles.meta}>EAN: {p.referencia}</Text> : null}
              <View style={styles.actions}>
                <Button variant="outline" onPress={() => { setModalMover(p); setNovoEndereco('') }} style={{ flex: 1 }}>
                  Mover
                </Button>
                <Button variant="outline" onPress={() => void abrirHistorico(p)} style={{ flex: 1 }}>
                  Histórico
                </Button>
                <Button variant="outline" onPress={() => setPrintProduto(p)} style={{ flex: 1 }}>
                  Imprimir
                </Button>
                <Button variant="outline" onPress={() => confirmarDesaparecimento(p)} style={{ flex: 1 }} disabled={p.desaparecido}>
                  Não enc.
                </Button>
              </View>
            </Card>
          ))}

          {filtrados.length > 0 ? (
            <Button variant="outline" onPress={() => setPrintLoteEnderecoOpen(true)} style={{ marginTop: space.md }}>
              Imprimir etiquetas do endereço inteiro
            </Button>
          ) : null}

          {produtos.length === 0 && !loading ? (
            <Card style={{ padding: space.lg, marginTop: space.md, backgroundColor: colors.primaryMuted }}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="information-outline" size={22} color={colors.primary} />
                <Text style={styles.infoTxt}>
                  Informe o endereço, busque os produtos cadastrados e confira fisicamente. Use Mover para atualizar o
                  cadastro ou Não enc. para registrar desaparecimento.
                </Text>
              </View>
            </Card>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalMover != null} transparent animationType="fade">
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setModalMover(null)} />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Mover produto</Text>
            {modalMover ? (
              <>
                <Text style={styles.modalSub} numberOfLines={2}>
                  {modalMover.descrprod}
                </Text>
                <Text style={styles.muted}>Atual: {enderecoAtual}</Text>
                <Text style={styles.label}>Novo endereço</Text>
                <Input
                  value={novoEndereco}
                  onChangeText={(t) => setNovoEndereco(formatarEndereco(t))}
                  placeholder="00.00.00.000"
                />
                <View style={styles.rowBtns}>
                  <Button variant="outline" onPress={() => setModalMover(null)} style={{ flex: 1 }}>
                    Cancelar
                  </Button>
                  <Button
                    variant="default"
                    onPress={() => void confirmarMover()}
                    disabled={!validarEnderecoCompleto(formatarEndereco(novoEndereco).trim())}
                    style={{ flex: 1 }}
                  >
                    Confirmar
                  </Button>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={modalHistorico != null} transparent animationType="slide">
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setModalHistorico(null)} />
          <View style={[styles.modalBox, { maxHeight: '75%' }]}>
            <View style={styles.histHead}>
              <Text style={styles.modalTitle}>Histórico de endereços</Text>
              <Pressable onPress={() => setModalHistorico(null)} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>
            {modalHistorico?.loading ? (
              <ActivityIndicator style={{ margin: space.lg }} color={colors.primary} />
            ) : (
              <FlatList
                data={modalHistorico?.itens ?? []}
                keyExtractor={(_, i) => String(i)}
                contentContainerStyle={{ paddingBottom: space.lg }}
                ListEmptyComponent={
                  <Text style={styles.muted}>Nenhuma alteração de endereço encontrada.</Text>
                }
                renderItem={({ item }) => (
                  <View style={styles.histItem}>
                    <Text style={styles.meta}>{fmtHist(item.dataAlteracao, item.dataAlteracaoRaw)} · {item.usuario}</Text>
                    <Text style={styles.meta}>
                      {item.enderecoAnterior ?? '(vazio)'} → {item.enderecoNovo ?? '(vazio)'}
                    </Text>
                  </View>
                )}
              />
            )}
            <Button variant="outline" onPress={() => setModalHistorico(null)}>
              Fechar
            </Button>
          </View>
        </View>
      </Modal>

      <EtiquetaPrintModal
        visible={printProduto != null}
        title="Imprimir etiqueta do produto"
        contexto={{
          codprod: printProduto?.codprod,
          descrprod: printProduto?.descrprod,
          endereco: enderecoAtual || undefined,
        }}
        onClose={() => setPrintProduto(null)}
        onSubmit={async ({ template, parametros, quantidade }) => {
          const res = await postImprimir({
            template,
            parametros,
            quantidade,
            agenteId: AGENTE_ID_IMPRESSAO,
            impressora: IMPRESSORA_LOGICO,
          })
          showWmsSuccess('Impressão', res.message ?? `Pedido enviado (${res.total ?? quantidade} job).`)
        }}
      />

      <EtiquetaPrintModal
        visible={printLoteEnderecoOpen}
        title="Imprimir etiquetas do endereço"
        contexto={{ endereco: enderecoAtual || undefined }}
        onClose={() => setPrintLoteEnderecoOpen(false)}
        onSubmit={async ({ template, parametros, quantidade }) => {
          let total = 0
          for (const p of filtrados) {
            const payload = { ...parametros }
            if (!Object.keys(payload).some((k) => k.toLowerCase().includes('codprod'))) {
              payload.codprod = p.codprod
            }
            if (!Object.keys(payload).some((k) => k.toLowerCase().includes('endereco')) && enderecoAtual) {
              payload.endereco = enderecoAtual
            }
            const res = await postImprimir({
              template,
              parametros: payload,
              quantidade,
              agenteId: AGENTE_ID_IMPRESSAO,
              impressora: IMPRESSORA_LOGICO,
            })
            total += res.total ?? quantidade
          }
          showWmsSuccess('Impressão', `Etiquetas enfileiradas para ${filtrados.length} produto(s). Total aprox.: ${total}.`)
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: wmsUiTokens.screenPadding, paddingBottom: wmsUiTokens.screenBottomPadding },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  rowBtns: { flexDirection: 'row', gap: space.md },
  tabs: { flexDirection: 'row', gap: space.xs },
  tab: {
    flex: 1,
    paddingVertical: space.sm,
    paddingHorizontal: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  tabOn: { backgroundColor: colors.primary },
  tabTxt: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  tabTxtOn: { color: '#FFF' },
  subLoc: { marginTop: space.md, fontSize: 14, color: colors.textMuted },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  cod: { fontSize: 13, fontWeight: '800', color: colors.primary },
  desc: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 4 },
  meta: { fontSize: 13, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  infoRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  infoTxt: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  modalRoot: { flex: 1, justifyContent: 'center', padding: space.lg },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalSub: { fontSize: 14, color: colors.text, marginTop: space.sm },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: space.md, marginBottom: 6 },
  histHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md },
  histItem: {
    padding: space.md,
    marginBottom: space.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
})
