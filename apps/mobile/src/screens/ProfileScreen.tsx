import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radii, space } from '@wms/theme'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import type { MainTabParamList } from '../navigation/types'
import { getPushNotificationsOptIn, setPushNotificationsOptIn } from '../services/pushSettingsStorage'
import { registerWmsPushNow } from '../services/registerWmsPushNow'
import type { ProfileResponse } from '../types/api'

type Props = BottomTabScreenProps<MainTabParamList, 'Perfil'>

function displayName(p: ProfileResponse | null): string {
  if (!p) return 'Usuário'
  const o = p as Record<string, unknown>
  const a = o.nomeusu ?? o.nome ?? o.NOMEUSU ?? o.nomeUsu
  return typeof a === 'string' && a.trim() ? a : 'Usuário'
}

function displayEmail(p: ProfileResponse | null): string | undefined {
  if (!p) return undefined
  const o = p as Record<string, unknown>
  const e = o.email ?? o.EMAIL
  return typeof e === 'string' ? e : undefined
}

function pushRegisterHint(reason: string): string {
  if (reason === 'opt_out') return 'Ative o interruptor para registar o dispositivo.'
  if (reason === 'permission_denied') return 'Permissão de notificações negada nas definições do sistema.'
  if (reason === 'no_token') return 'Token push indisponível (simulador ou build sem EAS projectId / dev build).'
  if (reason === 'server_error') return 'O servidor recusou o registo do token (path ou contrato — ver notificações no backend).'
  return 'Não foi possível sincronizar com o servidor.'
}

export function ProfileScreen({ navigation }: Props) {
  const { user: authUser, logout } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [pushRegisterHintText, setPushRegisterHintText] = useState<string | null>(null)

  useEffect(() => {
    void getPushNotificationsOptIn().then(setNotifications)
  }, [])

  const onNotificationsChange = useCallback(async (enabled: boolean) => {
    setNotifications(enabled)
    setPushRegisterHintText(null)
    await setPushNotificationsOptIn(enabled)
    if (!enabled) return
    const r = await registerWmsPushNow()
    if (!r.ok) setPushRegisterHintText(pushRegisterHint(r.reason))
  }, [])

  const subtitle = useMemo(() => {
    if (!authUser) return ''
    const o = authUser as Record<string, unknown>
    const perfil = o.perfil ?? o.PERFIL ?? o.role
    return typeof perfil === 'string' ? perfil : 'Operador WMS'
  }, [authUser])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Perfil e configurações" onBack={() => navigation.navigate('Home', { screen: 'Dashboard' })} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={{ padding: space.lg }}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={36} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{displayName(authUser)}</Text>
              <Text style={styles.role}>{subtitle}</Text>
            </View>
          </View>
          {displayEmail(authUser) ? <Text style={styles.meta}>{displayEmail(authUser)}</Text> : null}
          <Text style={styles.metaMuted}>Dados carregados do servidor (Sankhya).</Text>
        </Card>

        <Card style={{ padding: space.lg, marginTop: space.md, gap: space.md }}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Notificações push</Text>
            <Switch
              value={notifications}
              onValueChange={(v) => void onNotificationsChange(v)}
              trackColor={{ true: colors.primaryMuted }}
            />
          </View>
          <Text style={styles.metaMuted}>
            Regista o token Expo no servidor para receber alertas WMS. Em Android com SDK 53 use development build
            (push não funciona no Expo Go).
          </Text>
          {pushRegisterHintText ? <Text style={styles.pushHint}>{pushRegisterHintText}</Text> : null}

          <View style={styles.divider} />
          <Button
            variant="outline"
            onPress={() => navigation.navigate('Ferramentas', { screen: 'WmsConfiguracoes' })}
          >
            Configurações WMS
          </Button>
          <Button
            variant="outline"
            onPress={() => navigation.navigate('Home', { screen: 'ShowcaseComponents' })}
          >
            Showcase de componentes
          </Button>
        </Card>

        <Button
          variant="outline"
          onPress={() => navigation.navigate('Home', { screen: 'Dashboard' })}
          style={{ marginTop: space.lg }}
        >
          Voltar ao início
        </Button>

        <Button variant="danger" onPress={() => void logout()} style={{ marginTop: space.md }}>
          Sair da conta
        </Button>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.lg, paddingBottom: space.xl * 2 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  role: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  meta: { fontSize: 14, color: colors.text, marginTop: 8 },
  metaMuted: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  pushHint: { fontSize: 12, color: colors.warning, marginTop: space.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space.xs },
})
