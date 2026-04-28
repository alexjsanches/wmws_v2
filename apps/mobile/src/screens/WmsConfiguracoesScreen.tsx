import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@wms/theme'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { itemLabelWmsConfig, useWmsConfiguracoes } from '../features/wms/configuracoes/useWmsConfiguracoes'
import { wmsUiTokens } from '../features/wms/ui/tokens'
import type { FerramentasStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<FerramentasStackParamList, 'WmsConfiguracoes'>

export function WmsConfiguracoesScreen({ navigation }: Props) {
  const {
    codempText,
    setCodempText,
    loading,
    saving,
    refreshing,
    setRefreshing,
    storageReady,
    fields,
    setFields,
    load,
    salvar,
  } = useWmsConfiguracoes()

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
                <Text style={styles.fieldTitle}>{itemLabelWmsConfig(f.key)}</Text>
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
