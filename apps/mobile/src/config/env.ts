import Constants from 'expo-constants'
import { logger } from '../services/logger'

/** Fallback se `app.json` → `expo.extra.apiUrl` estiver vazio (ex.: tunnel local / ngrok). */
const DEFAULT_API = 'https://incorruptibly-unidling-beth.ngrok-free.dev'

/**
 * URL base do backend.
 * Defina em `app.json` → `expo.extra.apiUrl` ou altere o DEFAULT_API aqui.
 */
export const API_BASE_URL: string =
  typeof Constants.expoConfig?.extra?.apiUrl === 'string' && Constants.expoConfig.extra.apiUrl.length > 0
    ? Constants.expoConfig.extra.apiUrl
    : DEFAULT_API

// Sanitiza e valida no boot para evitar URLs inválidas de configuração.
export const API_BASE_URL_NORMALIZED = API_BASE_URL.replace(/\/$/, '')

try {
  // eslint-disable-next-line no-new -- validação de URL no startup
  new URL(API_BASE_URL_NORMALIZED)
} catch {
  logger.warn('API_BASE_URL inválida. Usando fallback DEFAULT_API.', {
    configured: API_BASE_URL,
    fallback: DEFAULT_API,
  })
}
