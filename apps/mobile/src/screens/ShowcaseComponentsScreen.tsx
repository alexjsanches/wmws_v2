import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radii, space } from '@wms/theme'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SnkActionSheet } from '../components/ui/SnkActionSheet'
import { SnkBadge } from '../components/ui/SnkBadge'
import { SnkCheckbox, type SnkCheckboxValue } from '../components/ui/SnkCheckbox'
import { SnkCheckboxList } from '../components/ui/SnkCheckboxList'
import { SnkColorPicker } from '../components/ui/SnkColorPicker'
import { SnkEntityCard } from '../components/ui/SnkEntityCard'
import { SnkList } from '../components/ui/SnkList'
import { SnkDateInput } from '../components/ui/SnkDateInput'
import { SnkDatePeriodInput, type DatePeriod } from '../components/ui/SnkDatePeriodInput'
import { SnkDateTimeInput } from '../components/ui/SnkDateTimeInput'
import {
  SnkFilterSheet,
  snkFilterValuesHaveActive,
  type SnkFilterField,
  type SnkFilterValues,
} from '../components/ui/SnkFilterSheet'
import { SnkField } from '../components/ui/SnkField'
import { SnkSearchBar } from '../components/ui/SnkSearchBar'
import { SnkNumberInput } from '../components/ui/SnkNumberInput'
import { SnkLoadingBar } from '../components/ui/SnkLoadingBar'
import { SnkLoadingOverlay } from '../components/ui/SnkLoadingOverlay'
import { SnkNumericStepper } from '../components/ui/SnkNumericStepper'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { SnkSwitch } from '../components/ui/SnkSwitch'
import { SnkTable, type SnkColumnDef, type SnkSortState } from '../components/ui/SnkTable'
import type { HomeStackParamList } from '../navigation/types'
import { formatarDataBr } from '../utils/dateBr'

type Props = NativeStackScreenProps<HomeStackParamList, 'ShowcaseComponents'>

type DemoSeparacao = {
  NUNOTA: number
  NOMEPARC: string
  QTDITENS: number
  STATUS: string
}

const CHECKBOX_LIST_OPTIONS = [
  { data: 'A', value: 'Aprovado' },
  { data: 'P', value: 'Pendente' },
  { data: 'R', value: 'Rejeitado' },
] as const

const DEMO_FILTER_FIELDS: SnkFilterField[] = [
  { key: 'ref', label: 'Referência / nota', type: 'text', placeholder: 'Ex.: 1001' },
  {
    key: 'status',
    label: 'Status',
    type: 'options',
    options: [...CHECKBOX_LIST_OPTIONS],
  },
  { key: 'periodo', label: 'Período', type: 'date_period' },
]

type DemoTableRow = Record<string, unknown> & {
  NUNOTA: number
  CODPARC: number
  NOMEPARC: string
  DTFATUR: string
  VLRNOTA: number
  STATUS: string
}

const DEMO_TABLE_ROWS: DemoTableRow[] = [
  { NUNOTA: 1001, CODPARC: 12, NOMEPARC: 'Alpha Lda', DTFATUR: '2025-03-15', VLRNOTA: 1234.5, STATUS: 'Aberto' },
  { NUNOTA: 1002, CODPARC: 44, NOMEPARC: 'Beta SA', DTFATUR: '2025-03-10', VLRNOTA: 987.0, STATUS: 'Fechado' },
  { NUNOTA: 1003, CODPARC: 7, NOMEPARC: 'Gamma', DTFATUR: '2025-02-28', VLRNOTA: 50.25, STATUS: 'Aberto' },
]

const DEMO_TABLE_COLUMNS: SnkColumnDef<DemoTableRow>[] = [
  { field: 'NUNOTA', header: 'NF', dataType: 'I', width: 64 },
  { field: 'CODPARC', header: 'Cód', dataType: 'I', width: 56 },
  { field: 'NOMEPARC', header: 'Parceiro', dataType: 'S', width: 160 },
  { field: 'DTFATUR', header: 'Data', dataType: 'D', width: 88 },
  { field: 'VLRNOTA', header: 'Valor', dataType: 'CUR', width: 96 },
  { field: 'STATUS', header: 'Status', dataType: 'S', width: 88 },
]

const DEMO_SEPARACOES: DemoSeparacao[] = [
  { NUNOTA: 1001, NOMEPARC: 'Parceiro Alpha', QTDITENS: 4, STATUS: 'Pendente' },
  { NUNOTA: 1002, NOMEPARC: 'Parceiro Beta', QTDITENS: 12, STATUS: 'Em separação' },
  { NUNOTA: 1003, NOMEPARC: 'Parceiro Gamma', QTDITENS: 1, STATUS: 'Concluída' },
  { NUNOTA: 1004, NOMEPARC: 'Parceiro Delta', QTDITENS: 7, STATUS: 'Pendente' },
]

function statusColor(status: string): string {
  if (status === 'Concluída') return colors.success
  if (status === 'Em separação') return colors.warning
  return colors.textMuted
}

export function ShowcaseComponentsScreen({ navigation }: Props) {
  const [demoSnkSwitch, setDemoSnkSwitch] = useState('N')
  const [demoCustom, setDemoCustom] = useState('R')
  const [demoValor, setDemoValor] = useState('0')
  const [demoQtd, setDemoQtd] = useState('1')
  const [demoDtEntrega, setDemoDtEntrega] = useState<Date | undefined>(undefined)
  const [demoDtHora, setDemoDtHora] = useState<Date | undefined>(() => new Date())
  const [demoPeriodo, setDemoPeriodo] = useState<DatePeriod>({ dtIni: undefined, dtFin: undefined })
  const [demoListSelCount, setDemoListSelCount] = useState(0)
  const [demoLoadingBarTop, setDemoLoadingBarTop] = useState(false)
  const [demoLoadingBarTopIndeterminate, setDemoLoadingBarTopIndeterminate] = useState(false)
  const [demoLoadingBarLocal, setDemoLoadingBarLocal] = useState(false)
  const [demoLoadingBarLocalIndeterminate, setDemoLoadingBarLocalIndeterminate] = useState(false)
  const [demoLoadingOverlay, setDemoLoadingOverlay] = useState(false)
  const [demoActionSheetOpen, setDemoActionSheetOpen] = useState(false)
  const [demoActionSheetLog, setDemoActionSheetLog] = useState<string>('—')
  const [demoCheckboxAceito, setDemoCheckboxAceito] = useState(false)
  const [demoCheckboxTri, setDemoCheckboxTri] = useState<SnkCheckboxValue>(false)
  const [demoCheckboxListSel, setDemoCheckboxListSel] = useState<Array<string | number>>(['P'])
  const [demoColorHex, setDemoColorHex] = useState<string | undefined>(undefined)
  const [demoSearch, setDemoSearch] = useState('')
  const [demoFilters, setDemoFilters] = useState<SnkFilterValues>({})
  const [demoFilterSheetOpen, setDemoFilterSheetOpen] = useState(false)
  const [demoTableSort, setDemoTableSort] = useState<SnkSortState>({ field: 'NUNOTA', direction: 'desc' })
  const barTopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const demoHasActiveFilters = useMemo(() => snkFilterValuesHaveActive(demoFilters), [demoFilters])

  const demoTableSorted = useMemo(() => {
    const { field, direction } = demoTableSort
    const arr = [...DEMO_TABLE_ROWS]
    if (!direction || !field) return arr
    const mult = direction === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const va = a[field as keyof DemoTableRow]
      const vb = b[field as keyof DemoTableRow]
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mult
      return String(va).localeCompare(String(vb), 'pt-BR') * mult
    })
    return arr
  }, [demoTableSort])

  const onDemoListSelection = useCallback((sel: DemoSeparacao[]) => {
    setDemoListSelCount(sel.length)
  }, [])

  const fireTopLoadingBar = useCallback(() => {
    if (barTopTimerRef.current) clearTimeout(barTopTimerRef.current)
    setDemoLoadingBarTop(true)
    barTopTimerRef.current = setTimeout(() => {
      setDemoLoadingBarTop(false)
      barTopTimerRef.current = null
    }, 3500)
  }, [])

  useEffect(() => {
    return () => {
      if (barTopTimerRef.current) clearTimeout(barTopTimerRef.current)
    }
  }, [])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screenWrap}>
        <SnkLoadingBar loading={demoLoadingBarTop || demoLoadingBarTopIndeterminate} mode={demoLoadingBarTopIndeterminate ? 'indeterminate' : 'determinate'} />
        <ScreenHeader title="Showcase de componentes" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Telas de desenvolvimento para validar componentes alinhados ao Sankhya (sem impacto em produção).
        </Text>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkSearchBar + SnkFilterSheet</Text>
          <Text style={styles.cardHint}>
            Busca + botão de filtros; sheet com texto, opções e período (sem sk-personalized-filter).
          </Text>
          <SnkSearchBar
            value={demoSearch}
            onChangeValue={setDemoSearch}
            onSubmit={() => {}}
            onFilterPress={() => setDemoFilterSheetOpen(true)}
            hasActiveFilters={demoHasActiveFilters}
          />
          <Text style={styles.valueLine}>Pesquisa: {demoSearch || '—'}</Text>
          <Text style={styles.valueLine}>
            Filtros ativos: {demoHasActiveFilters ? JSON.stringify(demoFilters, (_, v) => (v instanceof Date ? v.toISOString() : v)) : '—'}
          </Text>
          <SnkFilterSheet
            visible={demoFilterSheetOpen}
            onClose={() => setDemoFilterSheetOpen(false)}
            fields={DEMO_FILTER_FIELDS}
            values={demoFilters}
            onApply={setDemoFilters}
            onClear={() => setDemoFilters({})}
          />
        </Card>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkTable</Text>
          <Text style={styles.cardHint}>
            `embedded` — lista dentro do `ScrollView` do showcase; long press na linha ativa seleção múltipla.
          </Text>
          <SnkTable<DemoTableRow>
            embedded
            columns={DEMO_TABLE_COLUMNS}
            data={demoTableSorted}
            keyExtractor={(row) => String(row.NUNOTA)}
            sortState={demoTableSort}
            onSortChange={setDemoTableSort}
            minWidth={560}
            style={styles.tableDemo}
          />
          <Text style={styles.valueLine}>
            Ordenação: {demoTableSort.field} {demoTableSort.direction ?? '—'}
          </Text>
        </Card>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkLoadingBar + SnkLoadingOverlay</Text>
          <Text style={styles.cardHint}>
            Barra no topo deste ecrã (3,5s). Caixa abaixo mostra a mesma barra dentro de um contentor com altura
            (position relative).
          </Text>
          <Button variant="outline" onPress={fireTopLoadingBar} style={styles.btnMargin}>
            Disparar barra no topo (3,5s)
          </Button>
          <View style={styles.loadingBtnRow}>
            <Button variant="outline" onPress={() => setDemoLoadingBarTopIndeterminate(true)}>
              Topo indeterminado: ligar
            </Button>
            <Button variant="outline" onPress={() => setDemoLoadingBarTopIndeterminate(false)}>
              Desligar
            </Button>
          </View>

          <View style={styles.loadingDemoBox}>
            <SnkLoadingBar
              loading={demoLoadingBarLocal || demoLoadingBarLocalIndeterminate}
              mode={demoLoadingBarLocalIndeterminate ? 'indeterminate' : 'determinate'}
            />
            <Text style={styles.loadingDemoFakeContent}>Conteúdo fictício por baixo da barra</Text>
          </View>
          <View style={styles.loadingBtnRow}>
            <Button variant="outline" onPress={() => setDemoLoadingBarLocal(true)}>
              Barra na caixa (det.): ligar
            </Button>
            <Button variant="outline" onPress={() => setDemoLoadingBarLocal(false)}>
              Desligar
            </Button>
          </View>
          <View style={styles.loadingBtnRow}>
            <Button variant="outline" onPress={() => setDemoLoadingBarLocalIndeterminate(true)}>
              Barra na caixa (indet.): ligar
            </Button>
            <Button variant="outline" onPress={() => setDemoLoadingBarLocalIndeterminate(false)}>
              Desligar
            </Button>
          </View>

          <Text style={[styles.cardHint, styles.hintAfterBlock]}>Overlay só nesta caixa</Text>
          <View style={styles.overlayDemoBox}>
            <Text style={styles.loadingDemoFakeContent}>Lista ou formulário por baixo</Text>
            <SnkLoadingOverlay visible={demoLoadingOverlay} label="Buscando itens…" />
          </View>
          <View style={styles.loadingBtnRow}>
            <Button variant="outline" onPress={() => setDemoLoadingOverlay(true)}>
              Mostrar overlay
            </Button>
            <Button variant="outline" onPress={() => setDemoLoadingOverlay(false)}>
              Esconder overlay
            </Button>
          </View>
        </Card>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkActionSheet</Text>
          <Text style={styles.cardHint}>
            Menu de overflow (ícone ⋮); fecha antes de executar a ação; variante danger e disabled.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menu de ações de exemplo"
            onPress={() => setDemoActionSheetOpen(true)}
            style={styles.actionSheetTrigger}
          >
            <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text} />
            <Text style={styles.actionSheetTriggerLabel}>Abrir sheet</Text>
          </Pressable>
          <Text style={styles.valueLine}>Última ação: {demoActionSheetLog}</Text>
          <SnkActionSheet
            visible={demoActionSheetOpen}
            onClose={() => setDemoActionSheetOpen(false)}
            title="NF 123456 — Parceiro ABC (demo)"
            actions={[
              {
                key: 'foto',
                label: 'Registrar foto de entrega',
                icon: 'camera',
                onPress: () => setDemoActionSheetLog('foto'),
              },
              {
                key: 'imprimir',
                label: 'Imprimir etiqueta',
                icon: 'printer',
                onPress: () => setDemoActionSheetLog('imprimir'),
              },
              {
                key: 'cancelar',
                label: 'Cancelar separação',
                icon: 'close-circle-outline',
                variant: 'danger',
                disabled: true,
                onPress: () => setDemoActionSheetLog('cancelar'),
              },
            ]}
          />
        </Card>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkCheckbox</Text>
          <Text style={styles.cardHint}>sk-checkbox — boolean e estado I (indeterminado)</Text>
          <SnkField label="Aceite">
            <SnkCheckbox value={demoCheckboxAceito} onChangeValue={setDemoCheckboxAceito} label="Li e aceito os termos" />
          </SnkField>
          <Text style={styles.valueLine}>Valor: {String(demoCheckboxAceito)}</Text>

          <SnkField label="Com indeterminado" style={styles.hintAfterBlock}>
            <SnkCheckbox
              value={demoCheckboxTri}
              onChangeValue={(v) => setDemoCheckboxTri(v)}
              label="Seleção parcial (demo)"
              acceptIndeterminate
            />
          </SnkField>
          <View style={styles.loadingBtnRow}>
            <Button variant="outline" onPress={() => setDemoCheckboxTri('I')}>
              Forçar indeterminado (I)
            </Button>
            <Button variant="outline" onPress={() => setDemoCheckboxTri(false)}>
              Limpar para false
            </Button>
          </View>
          <Text style={styles.valueLine}>Valor: {demoCheckboxTri === 'I' ? 'I' : String(demoCheckboxTri)}</Text>
        </Card>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkCheckboxList</Text>
          <Text style={styles.cardHint}>sk-checkbox-list — “Todos” com estado misto</Text>
          <SnkField label="Status (múltipla seleção)">
            <SnkCheckboxList
              embedded
              options={[...CHECKBOX_LIST_OPTIONS]}
              selected={demoCheckboxListSel}
              onChangeSelected={setDemoCheckboxListSel}
            />
          </SnkField>
          <Text style={styles.valueLine}>Selecionados: {demoCheckboxListSel.join(', ') || '—'}</Text>
        </Card>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkColorPicker</Text>
          <Text style={styles.cardHint}>sk-color-picker — valor RRGGBB sem `#` para API</Text>
          <SnkField label="Cor da etiqueta">
            <SnkColorPicker value={demoColorHex} onChangeValue={setDemoColorHex} squareMode />
          </SnkField>
          <Text style={styles.valueLine}>Valor API: {demoColorHex ?? '—'}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>SnkField + SnkSwitch</Text>
          <Text style={styles.cardHint}>Equivalente ao rótulo + input do sk-form-item</Text>

          <SnkField label="Ativo">
            <SnkSwitch
              accessibilityLabel="Ativo"
              value={demoSnkSwitch}
              onChangeValue={setDemoSnkSwitch}
            />
          </SnkField>
          <Text style={styles.valueLine}>Valor: {demoSnkSwitch}</Text>

          <SnkField label="Aprovado" required style={styles.hintAfterBlock}>
            <SnkSwitch
              accessibilityLabel="Aprovado"
              value={demoCustom}
              onChangeValue={setDemoCustom}
              trueValue="A"
              falseValue="R"
            />
          </SnkField>
          <Text style={styles.valueLine}>Valor: {demoCustom}</Text>

          <View style={styles.blockSpaced}>
            <Text style={styles.cardHint}>Estado desabilitado</Text>
            <SnkField label="Somente leitura" enabled={false}>
              <SnkSwitch
                accessibilityLabel="Somente leitura"
                value="S"
                onChangeValue={() => {}}
                enabled={false}
              />
            </SnkField>
          </View>
        </Card>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkNumberInput</Text>
          <Text style={styles.cardHint}>sk-number-input — pt-BR, alinhado à direita</Text>
          <SnkField label="Valor (2 decimais)" required>
            <SnkNumberInput value={demoValor} onChangeValue={setDemoValor} precision={2} />
          </SnkField>
          <Text style={styles.valueLine}>Valor normalizado (API/JS): {demoValor || '—'}</Text>
        </Card>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkNumericStepper</Text>
          <Text style={styles.cardHint}>sk-numeric-stepper — inteiro com +/−</Text>
          <SnkField label="Quantidade">
            <SnkNumericStepper value={demoQtd} onChangeValue={setDemoQtd} minValue={0} maxValue={999} step={1} />
          </SnkField>
          <Text style={styles.valueLine}>Valor: {demoQtd}</Text>
        </Card>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkDateInput</Text>
          <Text style={styles.cardHint}>sk-date-input</Text>
          <SnkField label="Data de entrega" required>
            <SnkDateInput value={demoDtEntrega} onChangeValue={setDemoDtEntrega} />
          </SnkField>
          <Text style={styles.valueLine}>
            Valor: {demoDtEntrega ? formatarDataBr(demoDtEntrega) : '—'}
          </Text>
        </Card>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkDateTimeInput</Text>
          <Text style={styles.cardHint}>sk-date-time-input</Text>
          <SnkField label="Data e hora">
            <SnkDateTimeInput value={demoDtHora} onChangeValue={setDemoDtHora} />
          </SnkField>
          <Text style={styles.valueLine}>
            Valor:{' '}
            {demoDtHora
              ? `${formatarDataBr(demoDtHora)} ${String(demoDtHora.getHours()).padStart(2, '0')}:${String(demoDtHora.getMinutes()).padStart(2, '0')}`
              : '—'}
          </Text>
        </Card>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkDatePeriodInput</Text>
          <Text style={styles.cardHint}>sk-date-period-input — fim do dia em 23:59</Text>
          <SnkField label="Período">
            <SnkDatePeriodInput value={demoPeriodo} onChangeValue={setDemoPeriodo} />
          </SnkField>
          <Text style={styles.valueLine}>
            Início: {demoPeriodo.dtIni ? formatarDataBr(demoPeriodo.dtIni) : '—'} · Fim:{' '}
            {demoPeriodo.dtFin ? formatarDataBr(demoPeriodo.dtFin) : '—'}
          </Text>
        </Card>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkBadge</Text>
          <Text style={styles.cardHint}>Pílula reutilizável fora do card</Text>
          <View style={styles.badgeRow}>
            <SnkBadge label="Pendente" color={colors.border} textColor={colors.text} />
            <SnkBadge label="Em separação" color={colors.warning} />
            <SnkBadge label="OK" color={colors.success} />
          </View>
        </Card>

        <Card style={[styles.card, styles.cardSpaced]}>
          <Text style={styles.cardTitle}>SnkList + SnkEntityCard</Text>
          <Text style={styles.cardHint}>
            sk-list — `embedded` aqui porque o showcase usa `ScrollView`; em ecrã próprio use `FlatList` (omitir
            `embedded`).
          </Text>
          <SnkList
            embedded
            data={DEMO_SEPARACOES}
            keyExtractor={(item) => String(item.NUNOTA)}
            multipleSelection
            onSelectionChange={onDemoListSelection}
            style={styles.listBox}
            contentContainerStyle={styles.listContent}
            renderItem={(item, selected) => (
              <SnkEntityCard
                pressable={false}
                title={`Nota ${item.NUNOTA}`}
                subtitle={item.NOMEPARC}
                info={`${item.QTDITENS} itens`}
                badges={[{ label: item.STATUS, color: statusColor(item.STATUS) }]}
                selected={selected}
              />
            )}
          />
          <Text style={styles.valueLine}>Selecionados: {demoListSelCount}</Text>
        </Card>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screenWrap: { flex: 1, position: 'relative' },
  scroll: { padding: space.lg, paddingBottom: space.xl * 2 },
  intro: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: space.lg },
  card: { padding: space.lg },
  cardSpaced: { marginTop: space.md },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: space.xs },
  cardHint: { fontSize: 12, color: colors.textMuted, marginBottom: space.sm },
  hintAfterBlock: { marginTop: space.md },
  blockSpaced: { marginTop: space.md },
  valueLine: { fontSize: 12, color: colors.textMuted, marginTop: space.sm },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  listBox: { maxHeight: 280, marginTop: space.sm },
  listContent: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, overflow: 'hidden' },
  tableDemo: { height: 220, marginTop: space.sm },
  btnMargin: { marginTop: space.sm },
  loadingDemoBox: {
    marginTop: space.md,
    height: 100,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  overlayDemoBox: {
    marginTop: space.md,
    height: 140,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  loadingDemoFakeContent: {
    padding: space.md,
    paddingTop: 16,
    fontSize: 14,
    color: colors.textMuted,
  },
  loadingBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.sm,
  },
  actionSheetTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    alignSelf: 'flex-start',
    marginTop: space.sm,
    paddingVertical: space.xs,
    paddingRight: space.md,
  },
  actionSheetTriggerLabel: { fontSize: 14, color: colors.text, fontWeight: '600' },
})
