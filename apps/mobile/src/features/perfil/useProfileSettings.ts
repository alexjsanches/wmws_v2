import { useCallback, useEffect, useMemo, useState } from 'react'
import { getPushNotificationsOptIn, setPushNotificationsOptIn } from '../../services/pushSettingsStorage'
import { registerWmsPushNow } from '../../services/registerWmsPushNow'
import type { ProfileResponse } from '../../types/api'

function pushRegisterHint(reason: string): string {
  if (reason === 'opt_out') return 'Ative o interruptor para registar o dispositivo.'
  if (reason === 'permission_denied') return 'Permissão de notificações negada nas definições do sistema.'
  if (reason === 'no_token') return 'Token push indisponível (simulador ou build sem EAS projectId / dev build).'
  if (reason === 'server_error') return 'O servidor recusou o registo do token (path ou contrato — ver notificações no backend).'
  return 'Não foi possível sincronizar com o servidor.'
}

export function displayNameProfile(p: ProfileResponse | null): string {
  if (!p) return 'Usuário'
  const o = p as Record<string, unknown>
  const a = o.nomeusu ?? o.nome ?? o.NOMEUSU ?? o.nomeUsu
  return typeof a === 'string' && a.trim() ? a : 'Usuário'
}

export function displayEmailProfile(p: ProfileResponse | null): string | undefined {
  if (!p) return undefined
  const o = p as Record<string, unknown>
  const e = o.email ?? o.EMAIL
  return typeof e === 'string' ? e : undefined
}

export function useProfileSettings(user: ProfileResponse | null) {
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
    if (!user) return ''
    const o = user as Record<string, unknown>
    const perfil = o.perfil ?? o.PERFIL ?? o.role
    return typeof perfil === 'string' ? perfil : 'Operador WMS'
  }, [user])

  return {
    notifications,
    pushRegisterHintText,
    onNotificationsChange,
    subtitle,
  }
}
