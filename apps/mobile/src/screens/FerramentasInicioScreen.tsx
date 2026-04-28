import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, space } from '@wms/theme'
import { Card } from '../components/ui/Card'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import type { FerramentasStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<FerramentasStackParamList, 'FerramentasInicio'>

const ferramentas: {
  titulo: string
  descricao: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  destino?: keyof FerramentasStackParamList
  acao?: 'movProativa'
}[] = [
  {
    titulo: 'Consulta de produtos',
    descricao: 'Estoque, reservas (vendas pendentes) e entradas pendentes por código.',
    icon: 'magnify',
    destino: 'ConsultaProduto',
  },
  {
    titulo: 'Gerência de produtos',
    descricao: 'Extrato de movimentação e saldo no período.',
    icon: 'clipboard-text-outline',
    destino: 'GerenciaExtrato',
  },
  {
    titulo: 'Configurações WMS',
    descricao: 'Preferências operacionais por usuário e empresa.',
    icon: 'tune-variant',
    destino: 'WmsConfiguracoes',
  },
  {
    titulo: 'Movimentação proativa',
    descricao: 'Consulta e reorganização por endereço ou por produto.',
    icon: 'swap-horizontal',
    acao: 'movProativa',
  },
]

export function FerramentasInicioScreen({ navigation }: Props) {
  const abrirFerramenta = (f: (typeof ferramentas)[number]) => {
    if (f.acao === 'movProativa') {
      navigation.getParent()?.navigate('Home', { screen: 'MovimentacaoProativaHub' })
      return
    }
    if (f.destino) {
      navigation.navigate(f.destino)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Ferramentas" />
      <View style={styles.body}>
        <Text style={styles.intro}>Escolha uma ferramenta.</Text>
        {ferramentas.map((f) => (
          <Card
            key={f.destino ?? f.acao}
            style={styles.card}
            onPress={() => abrirFerramenta(f)}
          >
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={f.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.titulo}>{f.titulo}</Text>
                <Text style={styles.desc}>{f.descricao}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
            </View>
          </Card>
        ))}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  intro: { fontSize: 14, color: colors.textMuted, marginBottom: space.xs },
  card: { padding: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 4 },
  titulo: { fontSize: 16, fontWeight: '700', color: colors.text },
  desc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
})
