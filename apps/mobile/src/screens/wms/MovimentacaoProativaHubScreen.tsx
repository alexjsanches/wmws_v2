import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, space } from '@wms/theme'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { SelectField } from '../../components/ui/SelectField'
import type { HomeStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<HomeStackParamList, 'MovimentacaoProativaHub'>

const empresaOptions = [
  { label: 'Empresa 1', value: '1' },
  { label: 'Empresa 3', value: '3' },
  { label: 'Empresa 5', value: '5' },
]

export function MovimentacaoProativaHubScreen({ navigation }: Props) {
  const [codempStr, setCodempStr] = useState('1')

  const codemp = Number(codempStr) || 1

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Movimentação proativa" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Card style={{ padding: space.lg, gap: space.md }}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="office-building-outline" size={22} color={colors.primary} />
            <Text style={styles.title}>Empresa para endereços</Text>
          </View>
          <Text style={styles.muted}>Usada nas consultas de estoque e endereço cadastrado (codemp).</Text>
          <SelectField
            label="Empresa"
            value={codempStr}
            options={empresaOptions}
            onChange={setCodempStr}
            placeholder="Selecionar"
          />
        </Card>

        <Card style={{ padding: space.lg, gap: space.sm, marginTop: space.md }}>
          <Button variant="default" onPress={() => navigation.navigate('MovimentacaoPorEndereco', { codemp })}>
            <View style={styles.btnInner}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#FFF" />
              <Text style={styles.btnText}>Iniciar por endereço</Text>
            </View>
          </Button>
        </Card>

        <Card style={{ padding: space.lg, gap: space.sm }}>
          <Button variant="outline" onPress={() => navigation.navigate('MovimentacaoPorProduto', { codemp })}>
            <View style={styles.btnInnerMuted}>
              <MaterialCommunityIcons name="package-variant" size={20} color={colors.text} />
              <Text style={styles.btnTextDark}>Iniciar por produto</Text>
            </View>
          </Button>
        </Card>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { padding: space.lg, paddingBottom: space.xl * 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  btnInnerMuted: { flexDirection: 'row', alignItems: 'center', gap: space.sm, justifyContent: 'center' },
  btnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  btnTextDark: { fontSize: 15, fontWeight: '600', color: colors.text },
})
