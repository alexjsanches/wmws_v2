import type { NativeStackScreenProps } from '@react-navigation/native-stack'
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

export function ConsultaProdutoScreen({ navigation }: Props) {
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
      return (
        <View style={styles.lista}>
          {estoque.map((e, i) => (
            <Card key={`${e.codemp}-${e.codlocal}-${e.controle ?? ''}-${i}`} style={styles.cardInner}>
              <Text style={styles.cardTitle}>
                Emp. {e.codemp} · Local {e.codlocal}
                {e.controle ? ` · ${e.controle}` : ''}
              </Text>
              {linhaRotuloValor('Estoque', fmtNum(e.estoque))}
              {linhaRotuloValor('Reservado', fmtNum(e.reservado))}
              {linhaRotuloValor('Disponível', fmtNum(e.disponivel))}
            </Card>
          ))}
        </View>
      )
    }

    if (aba === 'reservas') {
      if (reservas.length === 0) {
        return <Text style={styles.muted}>Sem reservas para este produto.</Text>
      }
      return (
        <View style={styles.lista}>
          {reservas.map((r, i) => (
            <Card key={`${r.nunota}-${i}`} style={styles.cardInner}>
              <Text style={styles.cardTitle}>Nota {r.nunota}</Text>
              {linhaRotuloValor('Empresa', String(r.codemp))}
              {linhaRotuloValor('Quantidade', fmtNum(r.qtd))}
              {r.codtipoper !== null ? linhaRotuloValor('TOP', String(r.codtipoper)) : null}
              {r.tipmov ? linhaRotuloValor('Tip. mov.', r.tipmov) : null}
              {linhaRotuloValor('Operação', r.descricaoTop || '—')}
            </Card>
          ))}
        </View>
      )
    }

    if (aba === 'entradas') {
      if (entradasPendentes.length === 0) {
        return <Text style={styles.muted}>Sem entradas pendentes.</Text>
      }
      return (
        <View style={styles.lista}>
          {entradasPendentes.map((en, i) => (
            <Card key={`${en.nunota ?? 'x'}-${i}`} style={styles.cardInner}>
              {en.nunota !== null ? linhaRotuloValor('Nota', String(en.nunota)) : null}
              {linhaRotuloValor('Quantidade', fmtNum(en.qtd))}
              {en.codtipoper !== null ? linhaRotuloValor('TOP', String(en.codtipoper)) : null}
              {linhaRotuloValor('Descrição', en.descricaoTop || '—')}
            </Card>
          ))}
        </View>
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
