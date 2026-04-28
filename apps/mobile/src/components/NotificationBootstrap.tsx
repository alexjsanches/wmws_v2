import * as Notifications from 'expo-notifications'
import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { registerPushDeviceUseCase } from '../application/use-cases'
import { useAuth } from '../context/AuthContext'
import { applyWmsNotificationData } from '../navigation/applyWmsNotificationData'
import { consumeNotificationOpenOnce } from '../navigation/notificationOpenDedup'
import { logger } from '../services/logger'
import { getPushNotificationsOptIn } from '../services/pushSettingsStorage'

function devPushLog(message: string, extra?: unknown) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    logger.warn(message, extra)
  }
}

function dataFromResponse(response: Notifications.NotificationResponse | null | undefined) {
  const c = response?.notification.request.content
  const data = c?.data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>
  }
  return null
}

function isUrgentNotificationData(data: Record<string, unknown> | null): boolean {
  if (!data) return false
  const priority = typeof data.priority === 'string' ? data.priority.toLowerCase() : ''
  const type = typeof data.type === 'string' ? data.type.toLowerCase() : ''
  return priority === 'urgent' || type === 'wms.alerta.urgente'
}

/**
 * Canal de notificação Android, handler em foreground, registo de token e deep link ao tocar.
 */
export function NotificationBootstrap() {
  const { isAuthenticated, user } = useAuth()
  const lastRegisteredToken = useRef<string | null>(null)

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data as Record<string, unknown> | null
        const isUrgent = isUrgentNotificationData(data)
        return {
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: isUrgent,
          shouldSetBadge: true,
        }
      },
    })
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      lastRegisteredToken.current = null
      return
    }

    let cancelled = false

    const registerIfNeeded = async () => {
      const optIn = await getPushNotificationsOptIn()
      if (!optIn || cancelled) {
        if (!optIn) devPushLog('Registo ignorado: notificações desligadas nas definições da app.')
        return
      }

      try {
        const result = await registerPushDeviceUseCase()
        if (cancelled) return
        if (!result.ok) {
          if (result.reason === 'permission_denied') {
            devPushLog('Registo ignorado: permissão de notificação não concedida.')
            return
          }
          if (result.reason === 'no_token') {
            devPushLog(
              'Sem token Expo (simulador, Expo Go Android SDK 53+, ou falta extra.eas.projectId / dev build).',
            )
            return
          }
          if (result.reason === 'opt_out') {
            devPushLog('Registo ignorado: notificações desligadas nas definições da app.')
            return
          }
          devPushLog('Falha ao registar token (rede, 401/404 no endpoint, etc.).')
          return
        }
        if (lastRegisteredToken.current === result.token) return
        lastRegisteredToken.current = result.token
        devPushLog('Token registado no backend.')
      } catch (e) {
        devPushLog('Falha ao registar token (rede, 401/404 no endpoint, etc.).', e)
      }
    }

    void registerIfNeeded()

    const subApp = AppState.addEventListener('change', (state) => {
      if (state === 'active') void registerIfNeeded()
    })

    return () => {
      cancelled = true
      subApp.remove()
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    const subTap = Notifications.addNotificationResponseReceivedListener((response) => {
      const id = response.notification.request.identifier
      if (!consumeNotificationOpenOnce(id)) return
      applyWmsNotificationData(dataFromResponse(response))
    })
    return () => subTap.remove()
  }, [])

  return null
}
