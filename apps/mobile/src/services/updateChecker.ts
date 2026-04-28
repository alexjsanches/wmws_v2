import * as Application from 'expo-application'
import { Alert, Linking, Platform } from 'react-native'
import { API_BASE_URL_NORMALIZED } from '../config/env'
import { logger } from './logger'
import { compareVersion } from '../utils/version'

type VersionCheckResponse = {
  version?: string
  mandatory?: boolean
  changelog?: string
  downloadUrl?: string
  shutdown?: boolean | 'true' | 'false' | 1 | 0
  shutdownMessage?: string
}

const VERSION_URL = `${API_BASE_URL_NORMALIZED}/api/wms/version`

export type UpdateCheckResult = {
  shutdown: boolean
  shutdownMessage?: string
}

function isTruthyFlag(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || v === 'true'
}

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  // Este fluxo manual é para distribuição Android por APK.
  if (Platform.OS !== 'android') return { shutdown: false }

  try {
    const res = await fetch(VERSION_URL, {
      headers: { Accept: 'application/json', 'ngrok-skip-browser-warning': 'true' },
    })
    if (!res.ok) return { shutdown: false }

    const json = (await res.json()) as VersionCheckResponse
    if (isTruthyFlag(json.shutdown)) {
      return { shutdown: true, shutdownMessage: json.shutdownMessage?.trim() || undefined }
    }

    const latest = (json.version ?? '').trim()
    const current = (Application.nativeApplicationVersion ?? '').trim()
    if (!latest || !current) return { shutdown: false }
    if (compareVersion(latest, current) <= 0) return { shutdown: false }
    const downloadUrl = (json.downloadUrl ?? '').trim()
    if (!downloadUrl) return { shutdown: false }

    const mandatory = isTruthyFlag(json.mandatory)
    const messageParts = [`Nova versao ${latest} disponivel.`]
    if (json.changelog?.trim()) messageParts.push(json.changelog.trim())
    if (mandatory) messageParts.push('Atualizacao obrigatoria.')

    Alert.alert('Atualizacao disponivel', messageParts.join('\n\n'), [
      ...(mandatory ? [] : [{ text: 'Agora nao', style: 'cancel' as const }]),
      {
        text: 'Baixar',
        onPress: () => {
          void Linking.openURL(downloadUrl)
        },
      },
    ])
  } catch (e) {
    // silencioso para usuário; logado para diagnóstico
    logger.debug('Falha ao consultar versão de atualização.', e)
  }
  return { shutdown: false }
}
