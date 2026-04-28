import * as Application from 'expo-application'
import { Alert, Linking, Platform } from 'react-native'
import { API_BASE_URL } from '../config/env'

type VersionCheckResponse = {
  version?: string
  mandatory?: boolean
  changelog?: string
}

const VERSION_URL = `${API_BASE_URL.replace(/\/$/, '')}/api/wms/version`
const APK_URL = `${API_BASE_URL.replace(/\/$/, '')}/api/wms/download/apk`

export async function checkForUpdate(): Promise<void> {
  // Este fluxo manual é para distribuição Android por APK.
  if (Platform.OS !== 'android') return

  try {
    const res = await fetch(VERSION_URL, {
      headers: { Accept: 'application/json', 'ngrok-skip-browser-warning': 'true' },
    })
    if (!res.ok) return

    const json = (await res.json()) as VersionCheckResponse
    const latest = (json.version ?? '').trim()
    const current = (Application.nativeApplicationVersion ?? '').trim()
    if (!latest || !current || latest === current) return

    const mandatory = json.mandatory === true
    const messageParts = [`Nova versao ${latest} disponivel.`]
    if (json.changelog?.trim()) messageParts.push(json.changelog.trim())
    if (mandatory) messageParts.push('Atualizacao obrigatoria.')

    Alert.alert('Atualizacao disponivel', messageParts.join('\n\n'), [
      ...(mandatory ? [] : [{ text: 'Agora nao', style: 'cancel' as const }]),
      {
        text: 'Baixar',
        onPress: () => {
          void Linking.openURL(APK_URL)
        },
      },
    ])
  } catch {
    // silencioso por design
  }
}
