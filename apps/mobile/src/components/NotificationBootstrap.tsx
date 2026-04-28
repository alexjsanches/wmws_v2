import * as Notifications from 'expo-notifications'
import { useEffect, useRef } from 'react'
import { AppState, Platform } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { applyWmsNotificationData } from '../navigation/applyWmsNotificationData'
import { consumeNotificationOpenOnce } from '../navigation/notificationOpenDedup'
import { postWmsNotificationsRegisterDevice } from '../services/notificationsApi'
import { getPushNotificationsOptIn } from '../services/pushSettingsStorage'
import { ensureAndroidNotificationChannel, getExpoPushTokenOrThrow } from '../services/wmsPushSetup'

function devPushLog(message: string, extra?: unknown) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console -- diagnóstico local (Metro)
    console.warn(`[WMS push] ${message}`, extra !== undefined ? extra : '')
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

/**
 * Canal de notificação Android, handler em foreground, registo de token e deep link ao tocar.
 */
export function NotificationBootstrap() {
  const { isAuthenticated, user } = useAuth()
  const lastRegisteredToken = useRef<string | null>(null)

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
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
        await ensureAndroidNotificationChannel()
        const { status: existing } = await Notifications.getPermissionsAsync()
        let finalStatus = existing
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        }
        if (finalStatus !== 'granted' || cancelled) {
          devPushLog('Registo ignorado: permissão de notificação não concedida.', { status: finalStatus })
          return
        }

        const expoPushToken = await getExpoPushTokenOrThrow()
        if (!expoPushToken || cancelled) {
          devPushLog(
            'Sem token Expo (simulador, Expo Go Android SDK 53+, ou falta extra.eas.projectId / dev build).',
          )
          return
        }
        if (lastRegisteredToken.current === expoPushToken) return

        await postWmsNotificationsRegisterDevice({
          expoPushToken,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        })
        lastRegisteredToken.current = expoPushToken
        devPushLog('Token registado no backend.', { platform: Platform.OS })
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
