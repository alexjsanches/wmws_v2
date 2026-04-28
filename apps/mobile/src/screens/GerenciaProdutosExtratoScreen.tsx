import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space } from '@wms/theme'
import { Button } from '../components/ui/Button'
import { DatePickerField } from '../components/ui/DatePickerField'
import { Input } from '../components/ui/Input'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { SnkField } from '../components/ui/SnkField'
import { SnkSuggestionLookup } from '../components/ui/SnkSuggestionLookup'
import type { FerramentasStackParamList } from '../navigation/types'
import { postGerenciaProdutosExtrato, type ExtratoLinha } from '../services/snkGerenciaProdutosApi'
import { DATA_INICIAL_AMPLA_API, dataDeHojeBr, formatarDataBr, inicioDoDia } from '../utils/dateBr'

type Props = NativeStackScreenProps<FerramentasStackParamList, 'GerenciaExtrato'>

type SentimentoLinha = 'entrada' | 'saida' | 'neutro'

/** Larguras fixas: mesma coluna em todas as linhas (evita desalinhamento com texto longo). */
const COLS: { key: string; label: string; width: number; lines?: number }[] = [
  { key: 'DTNEG', label: 'Data', width: 78, lines: 1 },
  { key: 'TIPMOV', label: 'Mov', width: 34, lines: 1 },
  { key: 'NUMNOTA', label: 'Nota', width: 52, lines: 1 },
  { key: 'NUNOTA', label: 'NÚ', width: 56, lines: 1 },
  { key: 'RAZAOSOCIAL', label: 'Parceiro', width: 120, lines: 2 },
  { key: 'DESCROPER', label: 'Tipo operação', width: 152, lines: 2 },
  { key: 'CODLOCAL', label: 'Local', width: 56, lines: 1 },
  { key: 'QTDNEG', label: 'Qtd', width: 58, lines: 1 },
  { key: 'SALDO', label: 'Saldo', width: 64, lines: 1 },
]

const TABELA_LARGURA_TOTAL = COLS.reduce((acc, c) => acc + c.width, 0)

const LINHAS_VISIVEIS = 5
const ALTURA_MIN_LINHA = 48
const TABELA_CORPO_MAX_ALTURA = LINHAS_VISIVEIS * ALTURA_MIN_LINHA

function valorCelula(linha: ExtratoLinha, key: string): string {
  const v = linha[key]
  return v !== undefined && v !== '' ? v : '—'
}

/** Interpreta quantidade negociada para classificar entrada/saída (extrato). */
function parseQuantidade(qtd: string | undefined): number {
  if (qtd === undefined || qtd === '') return NaN
  let t = String(qtd).trim().replace(/\s/g, '')
  if (t === '' || t === '—') return NaN
  let sign = 1
  if (/^-/.test(t)) {
    sign = -1
    t = t.slice(1)
  }
  if (/,/.test(t)) {
    t = t.replace(/\./g, '').replace(',', '.')
  } else {
    t = t.replace(/,/g, '.')
  }
  const n = parseFloat(t)
  return Number.isFinite(n) ? sign * n : NaN
}

function sentimentoLinha(linha: ExtratoLinha): SentimentoLinha {
  const q = parseQuantidade(linha.QTDNEG)
  if (Number.isNaN(q) || q === 0) return 'neutro'
  return q > 0 ? 'entrada' : 'saida'
}

function ultimoSaldoExibicao(linhas: ExtratoLinha[]): string {
  for (let i = linhas.length - 1; i >= 0; i--) {
    const s = linhas[i].SALDO
    if (s !== undefined && s !== '') return s
  }
  return '—'
}

export function GerenciaProdutosExtratoScreen({ navigation }: Props) {
  const [dateIni, setDateIni] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return inicioDoDia(d)
  })
  const [dateFin, setDateFin] = useState(() => inicioDoDia(new Date()))

  const [codProd, setCodProd] = useState('')
  const [descrProd, setDescrProd] = useState('')
  const [controle, setControle] = useState(' ')
  const [codLocal, setCodLocal] = useState('')
  const [descrLocal, setDescrLocal] = useState('')
  const [codEmp, setCodEmp] = useState('')
  const [descrEmp, setDescrEmp] = useState('')
  const [periodoDias, setPeriodoDias] = useState('0')
  const [visualizarSaldo, setVisualizarSaldo] = useState(true)
  const [vlrNegPos, setVlrNegPos] = useState(false)
  const [naoInformarDatas, setNaoInformarDatas] = useState(false)

  const [linhas, setLinhas] = useState<ExtratoLinha[]>([])
  const [loading, setLoading] = useState(false)
  const [consultou, setConsultou] = useState(false)

  const saldoAtual = useMemo(() => ultimoSaldoExibicao(linhas), [linhas])

  const consultar = useCallback(async () => {
    const prod = Number(String(codProd).trim())
    if (!Number.isFinite(prod) || prod <= 0) {
      Alert.alert('Validação', 'Código de produto inválido.')
      return
    }
    if (!naoInformarDatas && dateIni.getTime() > dateFin.getTime()) {
      Alert.alert('Validação', 'Data inicial maior que a final.')
      return
    }
    const pd = Number(String(periodoDias).trim())
    const periodoDiasNum = Number.isFinite(pd) ? pd : 0

    setLoading(true)
    setConsultou(true)
    try {
      const { linhas: data } = await postGerenciaProdutosExtrato({
        codProd: prod,
        dtIni: naoInformarDatas ? DATA_INICIAL_AMPLA_API : formatarDataBr(dateIni),
        dtFin: naoInformarDatas ? dataDeHojeBr() : formatarDataBr(dateFin),
        controle: controle === '' ? ' ' : controle,
        codLocal: codLocal.trim(),
        codEmp: String(codEmp).trim(),
        codEmp2: String(codEmp).trim(),
        periodoDias: periodoDiasNum,
        visualizarSaldo,
        vlrNegPos,
        filtro: {},
      })
      setLinhas(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao consultar.'
      Alert.alert('Extrato', msg)
      setLinhas([])
    } finally {
      setLoading(false)
    }
  }, [
    codProd,
    dateIni,
    dateFin,
    controle,
    codLocal,
    codEmp,
    periodoDias,
    visualizarSaldo,
    vlrNegPos,
    naoInformarDatas,
  ])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <ScreenHeader title="Gerência de produtos" onBack={() => navigation.goBack()} />

        <View style={styles.pad}>
          <SnkField label="Produto" required>
            <SnkSuggestionLookup
              entityName="Produto"
              fieldName="CODPROD"
              keyboardType="numeric"
              code={codProd}
              onChangeCode={setCodProd}
              description={descrProd}
              onChangeDescription={setDescrProd}
            />
          </SnkField>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Sem datas</Text>
            <Switch value={naoInformarDatas} onValueChange={setNaoInformarDatas} />
          </View>

          <View style={styles.row2}>
            <View style={styles.half}>
              <DatePickerField
                label="Início"
                value={dateIni}
                onChange={setDateIni}
                maximumDate={dateFin}
                disabled={naoInformarDatas}
              />
            </View>
            <View style={styles.half}>
              <DatePickerField
                label="Fim"
                value={dateFin}
                onChange={setDateFin}
                minimumDate={dateIni}
                disabled={naoInformarDatas}
              />
            </View>
          </View>

          <Text style={styles.label}>Controle</Text>
          <Input value={controle} onChangeText={setControle} style={styles.field} />

          <SnkField label="Local">
            <SnkSuggestionLookup
              entityName="LocalFinanceiro"
              fieldName="CODLOCAL"
              keyboardType="numeric"
              code={codLocal}
              onChangeCode={setCodLocal}
              description={descrLocal}
              onChangeDescription={setDescrLocal}
            />
          </SnkField>

          <SnkField label="Empresa">
            <SnkSuggestionLookup
              entityName="Empresa"
              fieldName="CODEMP"
              keyboardType="numeric"
              code={codEmp}
              onChangeCode={setCodEmp}
              description={descrEmp}
              onChangeDescription={setDescrEmp}
            />
          </SnkField>

          <Text style={styles.label}>Dias</Text>
          <Input keyboardType="numeric" value={periodoDias} onChangeText={setPeriodoDias} style={[styles.field, styles.narrow]} />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Saldo</Text>
            <Switch value={visualizarSaldo} onValueChange={setVisualizarSaldo} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Qtd ±</Text>
            <Switch value={vlrNegPos} onValueChange={setVlrNegPos} />
          </View>

          <Button variant="default" onPress={consultar} disabled={loading} style={styles.btn}>
            {loading ? '…' : 'Consultar'}
          </Button>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : null}

          {consultou && !loading && linhas.length === 0 ? <Text style={styles.empty}>Sem dados.</Text> : null}

          {linhas.length > 0 && !loading ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                style={styles.tableScroll}
                nestedScrollEnabled
              >
                <View style={[styles.tableWide, { width: TABELA_LARGURA_TOTAL }]}>
                  <View style={styles.trHeadRow}>
                    {COLS.map((c) => (
                      <View key={c.key} style={[styles.cellShell, { width: c.width }]}>
                        <Text style={styles.th} numberOfLines={2} ellipsizeMode="tail">
                          {c.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <ScrollView
                    style={styles.tableBodyScroll}
                    contentContainerStyle={styles.tableBodyContent}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    {linhas.map((item, index) => {
                      const s = sentimentoLinha(item)
                      const rowStyle =
                        s === 'entrada'
                          ? styles.trEntrada
                          : s === 'saida'
                            ? styles.trSaida
                            : index % 2 === 1
                              ? styles.trNeutroAlt
                              : styles.trNeutro
                      const textStyle =
                        s === 'entrada' ? styles.tdEntrada : s === 'saida' ? styles.tdSaida : styles.td
                      return (
                        <View key={`extrato-${index}`} style={[styles.tr, rowStyle]}>
                          {COLS.map((c) => (
                            <View key={c.key} style={[styles.cellShell, { width: c.width }]}>
                              <Text
                                style={[styles.tdBase, textStyle]}
                                numberOfLines={c.lines ?? 1}
                                ellipsizeMode="tail"
                              >
                                {valorCelula(item, c.key)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )
                    })}
                  </ScrollView>
                </View>
              </ScrollView>

              <View style={styles.footerSaldo}>
                <Text style={styles.footerLabel}>Saldo atual</Text>
                <Text style={styles.footerValor}>{saldoAtual}</Text>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: space.xl * 2 },
  pad: { paddingHorizontal: space.lg },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 4, marginTop: space.sm },
  field: { backgroundColor: colors.surface },
  narrow: { maxWidth: 120 },
  row2: { flexDirection: 'row', gap: space.md },
  half: { flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
    paddingVertical: space.xs,
  },
  switchLabel: { fontSize: 14, color: colors.text, flex: 1, paddingRight: space.md },
  btn: { marginTop: space.lg },
  loadingBox: { paddingVertical: space.lg, alignItems: 'center' },
  tableScroll: { marginTop: space.md, paddingHorizontal: space.md },
  tableWide: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 1,
    backgroundColor: colors.surface,
  },
  trHeadRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
  },
  tableBodyScroll: {
    maxHeight: TABELA_CORPO_MAX_ALTURA,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableBodyContent: {
    flexGrow: 0,
  },
  cellShell: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  empty: { fontSize: 14, color: colors.textMuted, marginTop: space.md },
  tr: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: ALTURA_MIN_LINHA,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 4,
  },
  trEntrada: { backgroundColor: colors.primaryMuted },
  trSaida: { backgroundColor: colors.dangerMuted },
  trNeutro: { backgroundColor: colors.surface },
  trNeutroAlt: { backgroundColor: colors.background },
  th: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  tdBase: { fontSize: 12 },
  td: { color: colors.text },
  tdEntrada: { color: colors.primaryDark, fontWeight: '600' },
  tdSaida: { color: colors.danger, fontWeight: '600' },
  footerSaldo: {
    marginTop: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  footerValor: { fontSize: 17, fontWeight: '800', color: colors.primaryDark },
})
