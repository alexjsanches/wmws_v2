import type { CompositeNavigationProp } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radii, space } from '@wms/theme'
import { Card } from '../components/ui/Card'
import type { HomeStackParamList } from '../navigation/types'
import type { MainTabParamList } from '../navigation/types'

type DashboardNav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>

type ModuloCard = {
  key: string
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  color: string
  onPress: () => void
}

export function DashboardScreen() {
  const navigation = useNavigation<DashboardNav>()

  const modulos: ModuloCard[] = [
    {
      key: 'rec',
      label: 'Recebimento',
      icon: 'truck-delivery-outline',
      color: colors.primary,
      onPress: () => navigation.navigate('RecebimentoLista'),
    },
    {
      key: 'arm',
      label: 'Armazenagem',
      icon: 'warehouse',
      color: colors.success,
      onPress: () => navigation.navigate('ArmazenagemLista'),
    },
    {
      key: 'sep',
      label: 'Separação',
      icon: 'package-variant-closed',
      color: colors.accentPurple,
      onPress: () => navigation.navigate('SeparacaoLista'),
    },
    {
      key: 'conf',
      label: 'Conferência',
      icon: 'clipboard-check-outline',
      color: colors.warning,
      onPress: () => navigation.navigate('ConferenciaLista'),
    },
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="cube-outline" size={28} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.brand}>WMS</Text>
              <Text style={styles.brandSub}>WorldSeg</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable hitSlop={10} style={styles.iconHit}>
              <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
            </Pressable>
            <Pressable hitSlop={10} style={styles.iconHit} onPress={() => navigation.navigate('Perfil')}>
              <MaterialCommunityIcons name="account-outline" size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.greet}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="lightning-bolt" size={22} color={colors.success} />
          </View>
          <View>
            <Text style={styles.greetTitle}>Olá!</Text>
            <Text style={styles.greetSub}>Escolha o módulo do armazém.</Text>
          </View>
        </View>

        <Text style={styles.section}>Módulos</Text>
        <View style={styles.grid}>
          {modulos.map((m) => (
            <Card key={m.key} onPress={m.onPress} style={styles.gridCard}>
              <View style={[styles.iconCircle, { backgroundColor: `${m.color}22` }]}>
                <MaterialCommunityIcons name={m.icon} size={24} color={m.color} />
              </View>
              <Text style={styles.gridLabel}>{m.label}</Text>
            </Card>
          ))}
        </View>

        <Card style={styles.statsOuter}>
          <Text style={styles.sectionInCard}>Resumo operacional</Text>
          <Text style={styles.statsHint}>
            Os totais detalhados virão da API quando o painel estiver ligado ao backend.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.lg, paddingBottom: space.xl * 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: space.md, flex: 1 },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 20, fontWeight: '800', color: colors.text },
  brandSub: { fontSize: 13, fontWeight: '600', color: colors.primary, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconHit: { padding: space.xs },
  greet: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.xl },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetTitle: { fontSize: 21, fontWeight: '800', color: colors.text },
  greetSub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginBottom: space.xl },
  gridCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: space.lg,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  gridLabel: { fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'center' },
  statsOuter: { padding: space.lg, marginBottom: space.xl },
  sectionInCard: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: space.sm },
  statsHint: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
})
