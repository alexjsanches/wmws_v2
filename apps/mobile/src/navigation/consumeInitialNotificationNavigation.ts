import * as Notifications from 'expo-notifications'
import { applyWmsNotificationData } from './applyWmsNotificationData'
import { consumeNotificationOpenOnce } from './notificationOpenDedup'

function dataFromResponse(response: Notifications.NotificationResponse | null | undefined) {
  const data = response?.notification.request.content.data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>
  }
  return null
}

/**
 * Abertura a frio (ou retorno) via toque na notificação — evita duplicar com o mesmo `identifier`.
 */
export async function consumeInitialNotificationNavigation(): Promise<void> {
  const response = await Notifications.getLastNotificationResponseAsync()
  if (!response) return
  const id = response.notification.request.identifier
  if (!consumeNotificationOpenOnce(id)) return
  applyWmsNotificationData(dataFromResponse(response))
}
