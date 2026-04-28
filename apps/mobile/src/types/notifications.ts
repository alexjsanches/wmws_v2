/** Corpo de POST /api/wms/notifications/send (JWT). */
export type WmsNotificationSendBody = {
  /** Destinatário; omitido = próprio utilizador do token (quando o backend assim definir). */
  codusu?: number
  title: string
  body: string
  /** Metadados para deep link no app (valores serializáveis em JSON). */
  data?: Record<string, string | number | boolean | null>
  type?: string
  priority?: 'default' | 'normal' | 'high'
}

/** Resposta típica do envio genérico (ajuste se o backend devolver outros campos). */
export type WmsNotificationSendResponse = {
  ok?: boolean
  tokensEnviados?: number
  message?: string
}

/** Corpo de POST /api/wms/notifications/register-token (JWT) — alinhar com o backend que grava AD_TWSUSRDVC. */
export type WmsNotificationRegisterDeviceBody = {
  expoPushToken: string
  platform?: 'ios' | 'android'
}

export type WmsNotificationRegisterDeviceResponse = {
  ok?: boolean
  message?: string
}
