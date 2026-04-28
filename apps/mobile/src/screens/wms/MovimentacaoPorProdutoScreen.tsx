import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useRef, useState } from 'react'
import {
  Alert,
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
  postMpEnderecoProduto,
  postMpHistoricoEnderecos,
  postMpLogMovimentacao,
  postMpProdutoPorCodigo,
  postMpProdutoPorCodigoBarras,
  postMpRegistrarMovimentacao,
  putMpEnderecoCadastroProduto,
} from '../../services/movimentacaoProativaApi'
import { formatarEndereco, parseEnderecoLocal, validarEnderecoCompleto } from '../../utils/formatarEndereco'
import { getCodUsu } from '../../utils/getCodUsu'

type Props = NativeStackScreenProps<HomeStackParamList, 'MovimentacaoPorProduto'>

type Step = 'produto' | 'endereco' | 'resultado'

export function MovimentacaoPorProdutoScreen({ navigation, route }: Props) {
  const { codemp } = route.params
  const { user } = useAuth()
  const codusu = getCodUsu(user)

  const [step, setStep] = useState<Step>('produto')
  const [codigo, setCodigo] = useState('')
  const [enderecoAtual, setEnderecoAtual] = useState('')
  const [produto, setProduto] = useState<ProdutoEndereco | null>(null)
  const produtoRef = useRef<ProdutoEndereco | null>(null)
  const lastAutoSearchRef = useRef('')
  const [enderecoCadastro, setEnderecoCadastro] = useState('')
  const [loading, setLoading] = useState(false)

  const [histOpen, setHistOpen] = useState(false)
  const [histItems, setHistItems] = useState<HistoricoEnderecoProduto[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [printModalOpen, setPrintModalOpen] = useState(false)

  const reset = () => {
    setStep('produto')
    setCodigo('')
    setEnderecoAtual('')
    setProduto(null)
    produtoRef.current = null
    lastAutoSearchRef.current = ''
    setEnderecoCadastro('')
  }

  const buscarProduto = async (codigoBruto?: string) => {
    const c = (codigoBruto ?? codigo).trim()
    if (!c) {
      Alert.alert('Produto', 'Informe o código ou o código de barras.')
      return
    }
    setLoading(true)
    try {
      const ehCodProd = c.length <= 5 && /^\d+$/.test(c)
      const res = ehCodProd
        ? await postMpProdutoPorCodigo({ codigo: c, codemp })
        : await postMpProdutoPorCodigoBarras({ codigoBarras: c, codemp })
      if (!res) {
        Alert.alert('Produto', ehCodProd ? 'Produto não encontrado com este código.' : 'Produto não encontrado com este EAN.')
        return
      }
      setProduto(res)
      produtoRef.current = res
      setStep('endereco')
    } catch (e) {
      showWmsError('Produto', e, 'Erro ao buscar.')
    } finally {
      setLoading(false)
    }
  }

  const buscarAoSairDoCampo = () => {
    if (loading || step !== 'produto') return
    const c = codigo.trim()
    if (!c) return
    if (lastAutoSearchRef.current === c) return
    lastAutoSearchRef.current = c
    void buscarProduto(c)
  }

  const comparar = async (endBruto?: string) => {
    const p = produtoRef.current ?? produto
    if (!p) return
    const end = formatarEndereco(endBruto ?? enderecoAtual).trim()
    setEnderecoAtual(end)
    if (!validarEnderecoCompleto(end)) {
      Alert.alert('Endereço', 'Formato inválido (00.00.00.000).')
      return
    }
    setLoading(true)
    try {
      const resp = await postMpEnderecoProduto({ codprod: p.codprod, codemp })
      if (!resp) {
        Alert.alert('Endereço', 'Não foi possível obter o endereço cadastrado.')
        return
      }
      const cad = resp.enderecoCadastro
      setEnderecoCadastro(cad)
      const divergente = cad.trim() !== end
      const { desaparecido } = await getMpVerificarDesaparecimento(p.codprod)

      if (divergente && desaparecido) {
        setLoading(false)
        Alert.alert('Produto estava desaparecido', `Cadastro: ${cad}\nEncontrado em: ${end}\nO que deseja fazer?`, [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Levar p/ cadastro',
            onPress: () => void registrarEncontradoVoltarCadastro(p, end, cad),
          },
          {
            text: 'Atualizar cadastro',
            onPress: () => void registrarEncontradoAtualizarCadastro(p, end, cad),
          },
        ])
        return
      }

      setStep('resultado')
    } catch (e) {
      showWmsError('Comparação', e, 'Erro.')
    } finally {
      setLoading(false)
    }
  }

  const requireCodusu = (): number | null => {
    if (!codusu) {
      Alert.alert('Movimentação', 'Perfil sem CODUSU — não é possível gravar log.')
      return null
    }
    return codusu
  }

  const registrarEncontradoVoltarCadastro = async (p: ProdutoEndereco, endLido: string, endCad: string) => {
    const u = requireCodusu()
    if (!u) return
    setLoading(true)
    try {
      await postMpLogMovimentacao({
        codusu: u,
        endlido: endLido,
        endcadastro: endCad,
        acao: `Produto encontrado em ${endLido} (desaparecido). Levar para cadastro ${endCad}.`,
        codprod: p.codprod,
        controle: p.controle || ' ',
        desaparecido: 'N',
      })
      showWmsSuccess('Sucesso', `Registrado. Leve fisicamente o produto para ${endCad}.`)
      reset()
    } catch (e) {
      showWmsError('Erro', e, 'Falha.')
    } finally {
      setLoading(false)
    }
  }

  const registrarEncontradoAtualizarCadastro = async (p: ProdutoEndereco, endLido: string, endCad: string) => {
    const u = requireCodusu()
    if (!u) return
    const partes = parseEnderecoLocal(endLido)
    if (!partes) {
      Alert.alert('Endereço', 'Endereço inválido.')
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
        codusu: u,
        endlido: endCad,
        endcadastro: endLido,
        acao: `Produto encontrado em ${endLido} (desaparecido). Cadastro atualizado de ${endCad} para ${endLido}.`,
        codprod: p.codprod,
        controle: p.controle || ' ',
        desaparecido: 'N',
      })
      showWmsSuccess('Sucesso', 'Cadastro atualizado.')
      reset()
    } catch (e) {
      showWmsError('Erro', e, 'Falha.')
    } finally {
      setLoading(false)
    }
  }

  const moverParaCadastro = () => {
    const p = produto
    if (!p) return
    const u = requireCodusu()
    if (!u) return
    showWmsConfirm(
      'Mover para cadastro',
      `Registrar movimentação lógica de ${enderecoAtual} → ${enderecoCadastro}?`,
      async () => {
        setLoading(true)
        try {
          await postMpLogMovimentacao({
            codusu: u,
            endlido: enderecoAtual,
            endcadastro: enderecoCadastro,
            acao: `Moveu produto de ${enderecoAtual} para ${enderecoCadastro} (cadastro)`,
            codprod: p.codprod,
            controle: p.controle || ' ',
          })
          const ok = await registrarMovimentacaoComPolitica({
            codprod: p.codprod,
            codvol: p.codvol || undefined,
            enderecoOrigem: enderecoAtual,
            enderecoDestino: enderecoCadastro,
            qtdMovimentada: 1,
            acao: 'moverParaCadastro',
          })
          if (!ok) return
          showWmsSuccess('Sucesso', 'Movimentação registrada.')
          reset()
        } catch (e) {
          showWmsError('Erro', e, 'Falha.')
        } finally {
          setLoading(false)
        }
      },
    )
  }

  const atualizarCadastro = () => {
    const p = produto
    if (!p) return
    const u = requireCodusu()
    if (!u) return
    const partes = parseEnderecoLocal(enderecoAtual)
    if (!partes) {
      Alert.alert('Endereço', 'Endereço atual inválido.')
      return
    }
    showWmsConfirm(
      'Atualizar cadastro',
      `Atualizar endereço do produto para ${enderecoAtual}?`,
      async () => {
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
            codusu: u,
            endlido: enderecoAtual,
            endcadastro: enderecoCadastro,
            acao: `Alterou cadastro de ${enderecoCadastro} para ${enderecoAtual}`,
            codprod: p.codprod,
            controle: p.controle || ' ',
          })
          const ok = await registrarMovimentacaoComPolitica({
            codprod: p.codprod,
            codvol: p.codvol || undefined,
            enderecoOrigem: enderecoCadastro,
            enderecoDestino: enderecoAtual,
            qtdMovimentada: 1,
            acao: 'atualizarCadastro',
          })
          if (!ok) return
          showWmsSuccess('Sucesso', 'Cadastro atualizado.')
          reset()
        } catch (e) {
          showWmsError('Erro', e, 'Falha.')
        } finally {
          setLoading(false)
        }
      },
    )
  }

  const registrarMovimentacaoComPolitica = async (payloadBase: {
    codprod: number
    enderecoOrigem: string
    enderecoDestino: string
    qtdMovimentada: number
    acao: string
    codvol?: string
  }) => {
    const primeira = await postMpRegistrarMovimentacao({
      ...payloadBase,
      codemp,
      codvol: payloadBase.codvol,
      qtd: payloadBase.qtdMovimentada,
    })
    if (primeira.success) return true
    if ('requireConfirmation' in primeira && primeira.requireConfirmation) {
      const avisos = primeira.policy.warnings.length
        ? primeira.policy.warnings.map((w) => `- ${w}`).join('\n')
        : primeira.message
      return await new Promise<boolean>((resolve) => {
        Alert.alert('Confirmação de política', avisos || 'Movimentação exige confirmação.', [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Confirmar e seguir',
            onPress: () => {
              void (async () => {
                const segunda = await postMpRegistrarMovimentacao({
                  ...payloadBase,
                  codemp,
                  codvol: payloadBase.codvol,
                  qtd: payloadBase.qtdMovimentada,
                  confirmarComAlerta: true,
                })
                if (!segunda.success) {
                  showWmsError('Movimentação', new Error(segunda.policy.errors.join('\n') || segunda.message), 'Movimentação bloqueada.')
                  resolve(false)
                  return
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
    }
    throw new Error(primeira.policy.errors.join('\n') || primeira.message || 'Movimentação bloqueada por política.')
  }

  const verEndCadastrado = async () => {
    const p = produto
    if (!p) return
    setLoading(true)
    try {
      const r = await postMpEnderecoProduto({ codprod: p.codprod, codemp })
      if (r) {
        Alert.alert('Endereço cadastrado', r.enderecoCadastro)
      } else {
        Alert.alert('Endereço', 'Não foi possível consultar.')
      }
    } catch (e) {
      showWmsError('Erro', e, 'Falha.')
    } finally {
      setLoading(false)
    }
  }

  const abrirHistorico = async () => {
    const p = produto
    if (!p) return
    setHistOpen(true)
    setHistLoading(true)
    setHistItems([])
    try {
      const items = await postMpHistoricoEnderecos({ codprod: p.codprod, codemp })
      setHistItems(items)
    } catch {
      setHistItems([])
    } finally {
      setHistLoading(false)
    }
  }

  const divergente = enderecoCadastro.trim() !== enderecoAtual.trim() && step === 'resultado'
  const formatHistDate = (d: Date | null, raw?: string) => {
    if (d && !Number.isNaN(d.getTime())) return d.toLocaleString('pt-BR')
    return raw?.trim() ? raw : 'Data inválida'
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Por produto" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={64}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card style={{ padding: space.md, marginBottom: space.md, backgroundColor: colors.primary }}>
            <Text style={styles.stepBanner}>
              {step === 'produto' && '1. Identificar produto'}
              {step === 'endereco' && '2. Endereço físico'}
              {step === 'resultado' && '3. Resultado'}
            </Text>
          </Card>

          {step === 'produto' ? (
            <Card style={{ padding: space.lg, gap: space.md }}>
              <Text style={styles.cardTitle}>Código ou EAN</Text>
              <Input
                value={codigo}
                onChangeText={setCodigo}
                placeholder="CODPROD ou código de barras"
                keyboardType="default"
                onSubmitEditing={() => void buscarProduto()}
                onBlur={buscarAoSairDoCampo}
              />
              <Button variant="default" onPress={() => void buscarProduto()} disabled={loading || !codigo.trim()}>
                {loading ? 'Buscando…' : 'Buscar produto'}
              </Button>
            </Card>
          ) : null}

          {step === 'endereco' && produto ? (
            <>
              <Card style={{ padding: space.lg, gap: space.sm, marginBottom: space.md }}>
                <Text style={styles.cod}>Cód. {produto.codprod}</Text>
                <Text style={styles.desc}>{produto.descrprod}</Text>
                <View style={styles.rowBtns}>
                  <Button variant="outline" onPress={() => void verEndCadastrado()} disabled={loading} style={{ flex: 1 }}>
                    Ver cadastro
                  </Button>
                  <Button variant="outline" onPress={() => void abrirHistorico()} disabled={loading} style={{ flex: 1 }}>
                    Histórico
                  </Button>
                </View>
              </Card>
              <Card style={{ padding: space.lg, gap: space.md }}>
                <Text style={styles.cardTitle}>Endereço onde está o produto</Text>
                <Input
                  value={enderecoAtual}
                  onChangeText={(t) => setEnderecoAtual(formatarEndereco(t))}
                  placeholder="00.00.00.000"
                  onSubmitEditing={() => void comparar()}
                />
                <View style={styles.rowBtns}>
                  <Button variant="outline" onPress={() => setStep('produto')} style={{ flex: 1 }}>
                    Voltar
                  </Button>
                  <Button
                    variant="default"
                    onPress={() => void comparar()}
                    disabled={loading || !validarEnderecoCompleto(formatarEndereco(enderecoAtual).trim())}
                    style={{ flex: 1 }}
                  >
                    Comparar
                  </Button>
                </View>
              </Card>
            </>
          ) : null}

          {step === 'resultado' && produto ? (
            <Card style={{ padding: space.lg, gap: space.md }}>
              <Text style={styles.desc}>{produto.descrprod}</Text>
              <View style={styles.badgesRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.muted}>Lido</Text>
                  <Badge tone="muted">{enderecoAtual}</Badge>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.muted}>Cadastro</Text>
                  <Badge tone={divergente ? 'warning' : 'success'}>{enderecoCadastro}</Badge>
                </View>
              </View>
              {!divergente ? (
                <Text style={styles.ok}>Endereços conferem.</Text>
              ) : (
                <>
                  <Text style={styles.warn}>Divergência — escolha uma ação:</Text>
                  <Button variant="default" onPress={moverParaCadastro} disabled={loading}>
                    Mover para cadastro (registrar)
                  </Button>
                  <Button variant="outline" onPress={atualizarCadastro} disabled={loading}>
                    Atualizar cadastro para endereço lido
                  </Button>
                </>
              )}
              <Button variant="outline" onPress={() => setPrintModalOpen(true)}>
                Imprimir etiqueta deste produto
              </Button>
              <Button variant="outline" onPress={reset}>
                Nova consulta
              </Button>
            </Card>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={histOpen} transparent animationType="slide" onRequestClose={() => setHistOpen(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setHistOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>Histórico</Text>
            {histLoading ? (
              <Text style={styles.muted}>Carregando…</Text>
            ) : histItems.length === 0 ? (
              <Text style={styles.muted}>Sem registros.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 280 }}>
                {histItems.slice(0, 30).map((h, i) => (
                  <Text key={i} style={styles.histLine}>
                    {formatHistDate(h.dataAlteracao, h.dataAlteracaoRaw)} · {h.usuario}:{' '}
                    {h.enderecoAnterior ?? '—'} → {h.enderecoNovo ?? '—'}
                  </Text>
                ))}
              </ScrollView>
            )}
            <Button variant="outline" onPress={() => setHistOpen(false)} style={{ marginTop: space.md }}>
              Fechar
            </Button>
          </View>
        </View>
      </Modal>

      <EtiquetaPrintModal
        visible={printModalOpen}
        title="Imprimir etiqueta do produto"
        contexto={{
          codprod: produto?.codprod,
          descrprod: produto?.descrprod,
          endereco: enderecoAtual || enderecoCadastro || undefined,
        }}
        onClose={() => setPrintModalOpen(false)}
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: wmsUiTokens.screenPadding, paddingBottom: wmsUiTokens.screenBottomPadding },
  stepBanner: { color: '#FFF', fontWeight: '800', textAlign: 'center', fontSize: 15 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  cod: { fontSize: 14, fontWeight: '800', color: colors.primary },
  desc: { fontSize: 15, fontWeight: '600', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
  rowBtns: { flexDirection: 'row', gap: space.md },
  badgesRow: { flexDirection: 'row', gap: space.md },
  ok: { fontSize: 14, color: colors.success, fontWeight: '700' },
  warn: { fontSize: 14, color: colors.warning, fontWeight: '700' },
  modalTitle: { fontSize: 17, fontWeight: '800', marginBottom: space.sm },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    padding: space.lg,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  histLine: { fontSize: 12, color: colors.text, marginBottom: 6 },
})
