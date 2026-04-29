import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space } from '@wms/theme'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { SnkDatePeriodInput } from '../components/ui/SnkDatePeriodInput'
import { SnkField } from '../components/ui/SnkField'
import { SnkSuggestionLookup } from '../components/ui/SnkSuggestionLookup'
import { SnkSwitch } from '../components/ui/SnkSwitch'
import { SnkTable, type SnkColumnDef } from '../components/ui/SnkTable'
import {
  useGerenciaProdutosExtrato,
} from '../features/ferramentas/gerenciaExtrato/useGerenciaProdutosExtrato'
import type { FerramentasStackParamList } from '../navigation/types'
import type { ExtratoLinha } from '../services/snkGerenciaProdutosApi'
import { inicioDoDia } from '../utils/dateBr'

type Props = NativeStackScreenProps<FerramentasStackParamList, 'GerenciaExtrato'>

type ExtratoRow = Record<string, unknown> & {
  id: string
  DTNEG: string
  TIPMOV: string
  NUMNOTA: string
  NUNOTA: string
  RAZAOSOCIAL: string
  DESCROPER: string
  CODLOCAL: string
  QTDNEG: string
  SALDO: string
}

const EXTRATO_COLUMNS: SnkColumnDef<ExtratoRow>[] = [
  { field: 'DTNEG', header: 'Data', dataType: 'S', width: 82 },
  { field: 'TIPMOV', header: 'Mov', dataType: 'S', width: 46 },
  { field: 'NUMNOTA', header: 'Nota', dataType: 'S', width: 78 },
  { field: 'NUNOTA', header: 'NÚ', dataType: 'S', width: 88 },
  { field: 'RAZAOSOCIAL', header: 'Parceiro', dataType: 'S', width: 170 },
  { field: 'DESCROPER', header: 'Tipo operação', dataType: 'S', width: 180 },
  { field: 'CODLOCAL', header: 'Local', dataType: 'S', width: 72 },
  { field: 'QTDNEG', header: 'Qtd', dataType: 'S', width: 86, align: 'right' },
  { field: 'SALDO', header: 'Saldo', dataType: 'S', width: 92, align: 'right' },
]

export function GerenciaProdutosExtratoScreen({ navigation }: Props) {
  const {
    dateIni,
    setDateIni,
    dateFin,
    setDateFin,
    codProd,
    setCodProd,
    descrProd,
    setDescrProd,
    controle,
    setControle,
    codLocal,
    setCodLocal,
    descrLocal,
    setDescrLocal,
    codEmp,
    setCodEmp,
    descrEmp,
    setDescrEmp,
    periodoDias,
    setPeriodoDias,
    visualizarSaldo,
    setVisualizarSaldo,
    vlrNegPos,
    setVlrNegPos,
    naoInformarDatas,
    setNaoInformarDatas,
    linhas,
    loading,
    consultou,
    saldoAtual,
    consultar,
  } = useGerenciaProdutosExtrato()

  const extratoRows: ExtratoRow[] = linhas.map((item, index) => ({
    id: `extrato-${index}`,
    DTNEG: item.DTNEG || '—',
    TIPMOV: item.TIPMOV || '—',
    NUMNOTA: item.NUMNOTA || '—',
    NUNOTA: item.NUNOTA || '—',
    RAZAOSOCIAL: item.RAZAOSOCIAL || '—',
    DESCROPER: item.DESCROPER || '—',
    CODLOCAL: item.CODLOCAL || '—',
    QTDNEG: item.QTDNEG || '—',
    SALDO: item.SALDO || '—',
  }))
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
            <SnkSwitch
              value={naoInformarDatas ? 'S' : 'N'}
              onChangeValue={(v) => setNaoInformarDatas(v === 'S')}
              accessibilityLabel="Sem datas"
            />
          </View>

          <SnkField label="Período">
            <SnkDatePeriodInput
              value={{ dtIni: dateIni, dtFin: dateFin }}
              onChangeValue={(period) => {
                if (period.dtIni) setDateIni(inicioDoDia(period.dtIni))
                if (period.dtFin) setDateFin(period.dtFin)
              }}
              enabled={!naoInformarDatas}
            />
          </SnkField>

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
            <SnkSwitch
              value={visualizarSaldo ? 'S' : 'N'}
              onChangeValue={(v) => setVisualizarSaldo(v === 'S')}
              accessibilityLabel="Saldo"
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Qtd ±</Text>
            <SnkSwitch
              value={vlrNegPos ? 'S' : 'N'}
              onChangeValue={(v) => setVlrNegPos(v === 'S')}
              accessibilityLabel="Quantidade mais ou menos"
            />
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
              <SnkTable<ExtratoRow>
                embedded
                columns={EXTRATO_COLUMNS}
                data={extratoRows}
                keyExtractor={(row) => row.id}
                minWidth={894}
                emptyText="Sem dados."
              />

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
  empty: { fontSize: 14, color: colors.textMuted, marginTop: space.md },
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
