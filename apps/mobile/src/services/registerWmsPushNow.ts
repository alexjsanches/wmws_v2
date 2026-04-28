import { Platform } from 'react-native'
import { postWmsNotificationsRegisterDevice } from './notificationsApi'
import { getPushNotificationsOptIn } from './pushSettingsStorage'
import { ensureAndroidNotificationChannel, getExpoPushTokenOrThrow } from './wmsPushSetup'
import * as Notifications from 'expo-notifications'

export type RegisterWmsPushResult = { ok: true; token: string } | { ok: false; reason: string }

/** Pede permissão, obtém token Expo e envia para o backend (JWT). */
export async function registerWmsPushNow(): Promise<RegisterWmsPushResult> {
  const optIn = await getPushNotificationsOptIn()
  if (!optIn) return { ok: false, reason: 'opt_out' }

  await ensureAndroidNotificationChannel()
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return { ok: false, reason: 'permission_denied' }

  const expoPushToken = await getExpoPushTokenOrThrow()
  if (!expoPushToken) return { ok: false, reason: 'no_token' }

  try {
    await postWmsNotificationsRegisterDevice({
      expoPushToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    })
  } catch {
    return { ok: false, reason: 'server_error' }
  }
  return { ok: true, token: expoPushToken }
}
