import Constants from 'expo-constants'

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
