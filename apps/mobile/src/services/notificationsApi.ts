import { apiJson } from './apiClient'
import type {
  WmsNotificationRegisterDeviceBody,
  WmsNotificationRegisterDeviceResponse,
  WmsNotificationSendBody,
  WmsNotificationSendResponse,
} from '../types/notifications'

const W = '/api/wms/notifications'

/**
 * Path para gravar o token Expo no backend (AD_TWSUSRDVC).
 * Se o teu servidor usar outro path, altera só aqui.
 */
export const WMS_NOTIFICATIONS_REGISTER_TOKEN_PATH = `${W}/register-token`

/** POST /api/wms/notifications/send — JWT; supervisor pode enviar para outro `codusu`. */
export function postWmsNotificationsSend(body: WmsNotificationSendBody) {
  return apiJson<WmsNotificationSendResponse>(`${W}/send`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** Regista o token push do dispositivo para o utilizador autenticado. */
export function postWmsNotificationsRegisterDevice(body: WmsNotificationRegisterDeviceBody) {
  return apiJson<WmsNotificationRegisterDeviceResponse>(WMS_NOTIFICATIONS_REGISTER_TOKEN_PATH, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
