import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { postWmsNotificationsRegisterDevice } from '../../services/notificationsApi'
import { getPushNotificationsOptIn } from '../../services/pushSettingsStorage'
import { ensureAndroidNotificationChannel, getExpoPushTokenOrThrow } from '../../services/wmsPushSetup'

export type RegisterPushDeviceResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'opt_out' | 'permission_denied' | 'no_token' | 'server_error' }

/**
 * Caso de uso: registrar (ou renovar) token push do dispositivo no backend.
 */
export async function registerPushDeviceUseCase(): Promise<RegisterPushDeviceResult> {
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
