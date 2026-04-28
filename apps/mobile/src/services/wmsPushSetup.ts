import Constants from 'expo-constants'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

const ANDROID_CHANNEL_ID = 'wms-default'
const ANDROID_URGENT_CHANNEL_ID = 'wakeup'

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'WMS WorldSeg',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B00',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  })

  await Notifications.setNotificationChannelAsync(ANDROID_URGENT_CHANNEL_ID, {
    name: 'WMS Urgente',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500],
    lightColor: '#FF0000',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  })
}

export function getAndroidNotificationChannelId(): string {
  return ANDROID_CHANNEL_ID
}

export function getAndroidUrgentNotificationChannelId(): string {
  return ANDROID_URGENT_CHANNEL_ID
}

/**
 * Token Expo Push (`ExponentPushToken[...]`).
 * Em Android, push remoto em Expo Go (SDK 53+) não está disponível — use development build.
 */
export async function getExpoPushTokenOrThrow(): Promise<string | null> {
  if (!Device.isDevice) {
    return null
  }
  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId
  try {
    const projectIdOpt = projectId ? { projectId } : {}
    const res = await Notifications.getExpoPushTokenAsync(projectIdOpt)
    return res.data ?? null
  } catch {
    return null
  }
}
