import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@wms/theme'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { showWmsError, showWmsSuccess } from '../features/wms/ui/feedback'
import { wmsUiTokens } from '../features/wms/ui/tokens'
import type { FerramentasStackParamList } from '../navigation/types'
import { getWmsConfigMe, putWmsConfigMe } from '../services/wmsApi'
import type { WmsConfigCatalogItem } from '../types/wms'

type Props = NativeStackScreenProps<FerramentasStackParamList, 'WmsConfiguracoes'>

type LocalField = {
  key: string
  type: WmsConfigCatalogItem['type']
  description?: string
  valueText: string
  valueBool: boolean
}

function jsonToText(v: unknown): string {
  if (v == null) return ''
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

function itemLabel(key: string): string {
  return key
    .toLowerCase()
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export function WmsConfiguracoesScreen({ navigation }: Props) {
  const [codempText, setCodempText] = useState('1')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [storageReady, setStorageReady] = useState<boolean | null>(null)
  const [fields, setFields] = useState<LocalField[]>([])

  const codemp = useMemo(() => {
    const n = Number(codempText)
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 1
  }, [codempText])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getWmsConfigMe(codemp)
      const next: LocalField[] = (res.catalog ?? []).map((c) => {
        const incoming = res.values?.[c.key]
        const effective = incoming ?? c.defaultValue
        const type = c.type ?? 'string'
        if (type === 'boolean') {
          return {
            key: c.key,
            type,
            description: c.description,
            valueText: '',
            valueBool: Boolean(effective),
          }
        }
        return {
          key: c.key,
          type,
          description: c.description,
          valueText: type === 'json' ? jsonToText(effective) : effective == null ? '' : String(effective),
          valueBool: false,
        }
      })
      setFields(next)
      setStorageReady(Boolean(res.storageReady))
    } catch (e) {
      showWmsError('Configurações WMS', e, 'Erro ao carregar configurações.')
      setFields([])
      setStorageReady(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [codemp])

  useEffect(() => {
    void load()
  }, [load])

  const salvar = async () => {
    const values: Record<string, unknown> = {}
    for (const f of fields) {
      if (f.type === 'boolean') {
        values[f.key] = f.valueBool
        continue
      }
      if (f.type === 'number') {
        const n = Number(String(f.valueText).replace(',', '.'))
        if (!Number.isFinite(n)) {
          showWmsError('Configurações WMS', new Error(`Valor inválido em "${itemLabel(f.key)}".`), 'Número inválido.')
          return
        }
        values[f.key] = n
        continue
      }
      if (f.type === 'json') {
        try {
          values[f.key] = f.valueText.trim() ? JSON.parse(f.valueText) : null
        } catch {
          showWmsError('Configurações WMS', new Error(`JSON inválido em "${itemLabel(f.key)}".`), 'JSON inválido.')
          return
        }
        continue
      }
      values[f.key] = f.valueText
    }

    setSaving(true)
    try {
      await putWmsConfigMe({ codemp, values })
      showWmsSuccess('Configurações WMS', 'Preferências salvas com sucesso.')
      await load()
    } catch (e) {
      showWmsError('Configurações WMS', e, 'Erro ao salvar configurações.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Configurações WMS" onBack={() => navigation.goBack()} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} />}
        >
          <Card style={styles.card}>
            <Text style={styles.label}>Empresa (codemp)</Text>
            <Input value={codempText} onChangeText={setCodempText} keyboardType="number-pad" placeholder="Ex.: 1" />
            <Text style={styles.helper}>
              Status de armazenamento: {storageReady == null ? 'indisponível' : storageReady ? 'OK' : 'não pronto'}
            </Text>
            <Button variant="outline" onPress={() => void load()}>
              Recarregar empresa
            </Button>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Preferências</Text>
            {fields.map((f) => (
              <View key={f.key} style={styles.fieldRow}>
                <Text style={styles.fieldTitle}>{itemLabel(f.key)}</Text>
                <Text style={styles.fieldKey}>{f.key}</Text>
                {f.description ? <Text style={styles.fieldDesc}>{f.description}</Text> : null}
                {f.type === 'boolean' ? (
                  <View style={styles.switchRow}>
                    <Text style={styles.switchText}>{f.valueBool ? 'Ativado' : 'Desativado'}</Text>
                    <Switch
                      value={f.valueBool}
                      onValueChange={(v) => {
                        setFields((prev) => prev.map((x) => (x.key === f.key ? { ...x, valueBool: v } : x)))
                      }}
                      trackColor={{ true: colors.primaryMuted }}
                    />
                  </View>
                ) : (
                  <Input
                    value={f.valueText}
                    onChangeText={(t) => {
                      setFields((prev) => prev.map((x) => (x.key === f.key ? { ...x, valueText: t } : x)))
                    }}
                    keyboardType={f.type === 'number' ? 'decimal-pad' : 'default'}
                    placeholder={f.type === 'number' ? 'Informe um número' : f.type === 'json' ? 'Informe JSON válido' : 'Informe um valor'}
                  />
                )}
              </View>
            ))}
            {!fields.length ? <Text style={styles.helper}>Nenhuma configuração disponível para esta empresa.</Text> : null}
          </Card>

          <Button onPress={() => void salvar()} disabled={saving || !fields.length}>
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </Button>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center' },
  scroll: {
    padding: wmsUiTokens.screenPadding,
    paddingBottom: wmsUiTokens.screenBottomPadding,
    gap: wmsUiTokens.sectionGap,
  },
  card: {
    padding: wmsUiTokens.cardPadding,
    gap: wmsUiTokens.sectionGap,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  helper: { fontSize: 12, color: colors.textMuted },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  fieldRow: {
    gap: 6,
    paddingBottom: wmsUiTokens.sectionGap,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  fieldKey: { fontSize: 12, color: colors.textMuted },
  fieldDesc: { fontSize: 12, color: colors.textMuted },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchText: { fontSize: 14, color: colors.text },
})
