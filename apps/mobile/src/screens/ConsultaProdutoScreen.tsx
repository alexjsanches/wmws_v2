import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radii, space } from '@wms/theme'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { SnkField } from '../components/ui/SnkField'
import { SnkSuggestionLookup } from '../components/ui/SnkSuggestionLookup'
import { SnkTable, type SnkColumnDef, type SnkSortState } from '../components/ui/SnkTable'
import { useConsultaProduto, type AbaConsultaProduto } from '../features/ferramentas/consultaProduto/useConsultaProduto'
import type { FerramentasStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<FerramentasStackParamList, 'ConsultaProduto'>

const ABAS: { key: AbaConsultaProduto; label: string }[] = [
  { key: 'produto', label: 'Produto' },
  { key: 'estoque', label: 'Estoque' },
  { key: 'reservas', label: 'Reservas' },
  { key: 'entradas', label: 'Entradas' },
]

function fmtNum(n: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(n)
}

function linhaRotuloValor(rotulo: string, valor: string) {
  return (
    <View style={styles.kvRow} key={rotulo}>
      <Text style={styles.kvRotulo}>{rotulo}</Text>
      <Text style={styles.kvValor} selectable>
        {valor}
      </Text>
    </View>
  )
}

type EstoqueRow = Record<string, unknown> & {
  id: string
  CODEMP: number
  CODLOCAL: number
  ESTOQUE: number
  RESERVADO: number
  DISPONIVEL: number
  CONTROLE: string
}
type ReservaRow = Record<string, unknown> & {
  id: string
  NUNOTA: number
  CODEMP: number
  QTD: number
  CODTIPOPER: number | null
  TIPMOV: string
  DESCRICAOTOP: string
}
type EntradaRow = Record<string, unknown> & {
  id: string
  NUNOTA: number | null
  QTD: number
  CODTIPOPER: number | null
  DESCRICAOTOP: string
}

const ESTOQUE_COLUMNS: SnkColumnDef<EstoqueRow>[] = [
  { field: 'CODEMP', header: 'Cód. em', dataType: 'I', width: 68 },
  { field: 'CODLOCAL', header: 'Local', dataType: 'I', width: 70 },
  { field: 'ESTOQUE', header: 'Estoque', dataType: 'F', width: 88 },
  { field: 'RESERVADO', header: 'Reservado', dataType: 'F', width: 100 },
  { field: 'DISPONIVEL', header: 'Disponível', dataType: 'F', width: 98 },
  { field: 'CONTROLE', header: 'Controle', dataType: 'S', width: 90 },
]
const RESERVA_COLUMNS: SnkColumnDef<ReservaRow>[] = [
  { field: 'NUNOTA', header: 'Nota', dataType: 'I', width: 104 },
  { field: 'CODEMP', header: 'Emp.', dataType: 'I', width: 62 },
  { field: 'QTD', header: 'Quantidade', dataType: 'F', width: 96 },
  { field: 'CODTIPOPER', header: 'TOP', dataType: 'I', width: 64, valueFormatter: (v) => (v == null ? '' : String(v)) },
  { field: 'TIPMOV', header: 'Tip. mov.', dataType: 'S', width: 84 },
  { field: 'DESCRICAOTOP', header: 'Operação', dataType: 'S', width: 180 },
]
const ENTRADA_COLUMNS: SnkColumnDef<EntradaRow>[] = [
  { field: 'NUNOTA', header: 'Nota', dataType: 'I', width: 104, valueFormatter: (v) => (v == null ? '' : String(v)) },
  { field: 'QTD', header: 'Quantidade', dataType: 'F', width: 96 },
  { field: 'CODTIPOPER', header: 'TOP', dataType: 'I', width: 64, valueFormatter: (v) => (v == null ? '' : String(v)) },
  { field: 'DESCRICAOTOP', header: 'Descrição', dataType: 'S', width: 220 },
]

export function ConsultaProdutoScreen({ navigation }: Props) {
  const [estoqueSort, setEstoqueSort] = useState<SnkSortState>({ field: 'CODLOCAL', direction: 'asc' })
  const [reservasSort, setReservasSort] = useState<SnkSortState>({ field: 'NUNOTA', direction: 'desc' })
  const [entradasSort, setEntradasSort] = useState<SnkSortState>({ field: 'NUNOTA', direction: 'desc' })
  const {
    codProd,
    setCodProd,
    descrProd,
    setDescrProd,
    aba,
    setAba,
    loading,
    data,
    hasData,
    consultar,
    consultarOnBlur,
  } = useConsultaProduto()

  const conteudoAba = (() => {
    if (!data) {
      return (
        <Text style={styles.placeholder}>
          Informe o produto e toque em Consultar para ver estoque, reservas e entradas pendentes.
        </Text>
      )
    }
    const { produto, estoque, reservas, entradasPendentes } = data

    if (aba === 'produto') {
      return (
        <Card style={styles.cardInner}>
          {linhaRotuloValor('Código', String(produto.codprod))}
          {linhaRotuloValor('Descrição', produto.descricao || '—')}
          {linhaRotuloValor('Marca', produto.marca || '—')}
          {linhaRotuloValor('Ref. fornecedor', produto.refforn || '—')}
          {linhaRotuloValor('Volume', produto.codvol || '—')}
          {linhaRotuloValor('AD_ST', produto.ad_st || '—')}
        </Card>
      )
    }

    if (aba === 'estoque') {
      if (estoque.length === 0) {
        return <Text style={styles.muted}>Nenhuma linha de estoque retornada.</Text>
      }
      const rows: EstoqueRow[] = estoque.map((e, i) => ({
        id: `${e.codemp}-${e.codlocal}-${e.controle ?? ''}-${i}`,
        CODEMP: e.codemp,
        CODLOCAL: e.codlocal,
        ESTOQUE: e.estoque,
        RESERVADO: e.reservado,
        DISPONIVEL: e.disponivel,
        CONTROLE: e.controle || '',
      }))
      const sortedRows = [...rows]
      if (estoqueSort.field && estoqueSort.direction) {
        const mult = estoqueSort.direction === 'asc' ? 1 : -1
        sortedRows.sort((a, b) => {
          const va = a[estoqueSort.field as keyof EstoqueRow]
          const vb = b[estoqueSort.field as keyof EstoqueRow]
          if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mult
          return String(va ?? '').localeCompare(String(vb ?? ''), 'pt-BR') * mult
        })
      }
      const summary: EstoqueRow = {
        id: '__summary__',
        CODEMP: 0,
        CODLOCAL: 0,
        ESTOQUE: rows.reduce((acc, r) => acc + (r.ESTOQUE || 0), 0),
        RESERVADO: rows.reduce((acc, r) => acc + (r.RESERVADO || 0), 0),
        DISPONIVEL: rows.reduce((acc, r) => acc + (r.DISPONIVEL || 0), 0),
        CONTROLE: '',
      }
      return (
        <SnkTable<EstoqueRow>
          embedded
          columns={ESTOQUE_COLUMNS}
          data={sortedRows}
          keyExtractor={(row) => row.id}
          minWidth={514}
          style={styles.estoqueTable}
          emptyText="Nenhuma linha de estoque retornada."
          summaryRow={summary}
          summaryLabel="Total"
          summaryLabelColumn="CODEMP"
          sortState={estoqueSort}
          onSortChange={setEstoqueSort}
        />
      )
    }

    if (aba === 'reservas') {
      if (reservas.length === 0) {
        return <Text style={styles.muted}>Sem reservas para este produto.</Text>
      }
      const rows: ReservaRow[] = reservas.map((r, i) => ({
        id: `${r.nunota}-${i}`,
        NUNOTA: r.nunota,
        CODEMP: r.codemp,
        QTD: r.qtd,
        CODTIPOPER: r.codtipoper,
        TIPMOV: r.tipmov || '',
        DESCRICAOTOP: r.descricaoTop || '',
      }))
      const sortedRows = [...rows]
      if (reservasSort.field && reservasSort.direction) {
        const mult = reservasSort.direction === 'asc' ? 1 : -1
        sortedRows.sort((a, b) => {
          const va = a[reservasSort.field as keyof ReservaRow]
          const vb = b[reservasSort.field as keyof ReservaRow]
          if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mult
          return String(va ?? '').localeCompare(String(vb ?? ''), 'pt-BR') * mult
        })
      }
      return (
        <SnkTable<ReservaRow>
          embedded
          columns={RESERVA_COLUMNS}
          data={sortedRows}
          keyExtractor={(row) => row.id}
          minWidth={558}
          style={styles.estoqueTable}
          emptyText="Sem reservas para este produto."
          sortState={reservasSort}
          onSortChange={setReservasSort}
        />
      )
    }

    if (aba === 'entradas') {
      if (entradasPendentes.length === 0) {
        return <Text style={styles.muted}>Sem entradas pendentes.</Text>
      }
      const rows: EntradaRow[] = entradasPendentes.map((en, i) => ({
        id: `${en.nunota ?? 'x'}-${i}`,
        NUNOTA: en.nunota,
        QTD: en.qtd,
        CODTIPOPER: en.codtipoper,
        DESCRICAOTOP: en.descricaoTop || '',
      }))
      const sortedRows = [...rows]
      if (entradasSort.field && entradasSort.direction) {
        const mult = entradasSort.direction === 'asc' ? 1 : -1
        sortedRows.sort((a, b) => {
          const va = a[entradasSort.field as keyof EntradaRow]
          const vb = b[entradasSort.field as keyof EntradaRow]
          if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mult
          return String(va ?? '').localeCompare(String(vb ?? ''), 'pt-BR') * mult
        })
      }
      return (
        <SnkTable<EntradaRow>
          embedded
          columns={ENTRADA_COLUMNS}
          data={sortedRows}
          keyExtractor={(row) => row.id}
          minWidth={452}
          style={styles.estoqueTable}
          emptyText="Sem entradas pendentes."
          sortState={entradasSort}
          onSortChange={setEntradasSort}
        />
      )
    }

    return null
  })()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Consulta de produtos" onBack={() => navigation.goBack()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
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
              onBlurCode={consultarOnBlur}
            />
          </SnkField>
          <Button variant="default" onPress={consultar} disabled={loading} style={styles.btn}>
            {loading ? (
              <View style={styles.btnLoading}>
                <ActivityIndicator color="#FFF" />
                <Text style={styles.btnLoadingText}>Consultando…</Text>
              </View>
            ) : (
              'Consultar'
            )}
          </Button>

          {hasData ? (
            <View style={styles.tabBar}>
              {ABAS.map((t) => {
                const ativo = aba === t.key
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setAba(t.key)}
                    style={[styles.tab, ativo && styles.tabAtivo]}
                  >
                    <Text style={[styles.tabLabel, ativo && styles.tabLabelAtivo]} numberOfLines={1}>
                      {t.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ) : null}

          <View style={styles.conteudo}>{conteudoAba}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: space.xl * 2 },
  pad: { padding: space.lg, gap: space.md },
  btn: { marginTop: space.xs },
  btnLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  btnLoadingText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginTop: space.sm,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  tabAtivo: { backgroundColor: colors.tabActiveBg },
  tabLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  tabLabelAtivo: { color: colors.text },
  conteudo: { marginTop: space.md, minHeight: 120 },
  placeholder: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  muted: { fontSize: 14, color: colors.textMuted },
  lista: { gap: space.md },
  estoqueTable: { minHeight: 180 },
  cardInner: { padding: space.md, gap: space.xs },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: space.xs },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  kvRotulo: { fontSize: 13, color: colors.textMuted, flexShrink: 0 },
  kvValor: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right' },
})
