import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import {
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
import { useMovimentacaoPorProduto } from '../../features/wms/movimentacao/useMovimentacaoPorProduto'
import { showWmsSuccess } from '../../features/wms/ui/feedback'
import { wmsUiTokens } from '../../features/wms/ui/tokens'
import type { HomeStackParamList } from '../../navigation/types'
import { AGENTE_ID_IMPRESSAO, IMPRESSORA_LOGICO, postImprimir } from '../../services/impressaoApi'
import { formatarEndereco, validarEnderecoCompleto } from '../../utils/formatarEndereco'
import { getCodUsu } from '../../utils/getCodUsu'

type Props = NativeStackScreenProps<HomeStackParamList, 'MovimentacaoPorProduto'>

export function MovimentacaoPorProdutoScreen({ navigation, route }: Props) {
  const { codemp } = route.params
  const { user } = useAuth()
  const codusu = getCodUsu(user)
  const {
    step,
    setStep,
    codigo,
    setCodigo,
    enderecoAtual,
    setEnderecoAtual,
    produto,
    enderecoCadastro,
    loading,
    histOpen,
    setHistOpen,
    histItems,
    histLoading,
    printModalOpen,
    setPrintModalOpen,
    reset,
    buscarProduto,
    buscarAoSairDoCampo,
    comparar,
    moverParaCadastro,
    atualizarCadastro,
    verEndCadastrado,
    abrirHistorico,
    divergente,
  } = useMovimentacaoPorProduto({ codemp, codusu })
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
