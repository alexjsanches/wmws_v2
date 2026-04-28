import * as SecureStore from 'expo-secure-store'

const KEY = 'wms_push_notifications_enabled'

export async function getPushNotificationsOptIn(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(KEY)
    if (v === null) return true
    return v === '1'
  } catch {
    return true
  }
}

export async function setPushNotificationsOptIn(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEY, enabled ? '1' : '0')
}
