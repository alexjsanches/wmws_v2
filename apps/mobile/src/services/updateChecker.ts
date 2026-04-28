import * as Application from 'expo-application'
import { Platform } from 'react-native'
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
  updateAvailable: boolean
  mandatory?: boolean
  latestVersion?: string
  currentVersion?: string
  changelog?: string
  downloadUrl?: string
}

function isTruthyFlag(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || v === 'true'
}

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  // Este fluxo manual é para distribuição Android por APK.
  if (Platform.OS !== 'android') return { shutdown: false, updateAvailable: false }

  try {
    const res = await fetch(VERSION_URL, {
      headers: { Accept: 'application/json', 'ngrok-skip-browser-warning': 'true' },
    })
    if (!res.ok) return { shutdown: false, updateAvailable: false }

    const json = (await res.json()) as VersionCheckResponse
    if (isTruthyFlag(json.shutdown)) {
      return {
        shutdown: true,
        shutdownMessage: json.shutdownMessage?.trim() || undefined,
        updateAvailable: false,
      }
    }

    const latest = (json.version ?? '').trim()
    const current = (Application.nativeApplicationVersion ?? '').trim()
    if (!latest || !current) return { shutdown: false, updateAvailable: false }
    if (compareVersion(latest, current) <= 0) {
      return {
        shutdown: false,
        updateAvailable: false,
        latestVersion: latest,
        currentVersion: current,
      }
    }
    const downloadUrl = (json.downloadUrl ?? '').trim()
    if (!downloadUrl) return { shutdown: false, updateAvailable: false }

    const mandatory = isTruthyFlag(json.mandatory)
    return {
      shutdown: false,
      updateAvailable: true,
      mandatory,
      latestVersion: latest,
      currentVersion: current,
      changelog: json.changelog?.trim() || undefined,
      downloadUrl,
    }
  } catch (e) {
    // silencioso para usuário; logado para diagnóstico
    logger.debug('Falha ao consultar versão de atualização.', e)
  }
  return { shutdown: false, updateAvailable: false }
}
