import * as SecureStore from 'expo-secure-store'

const AUTH_KEY = 'wms_auth_token'
const REFRESH_KEY = 'wms_refresh_token'

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(AUTH_KEY)
  } catch {
    return null
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY)
  } catch {
    return null
  }
}

export async function setTokens(authToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_KEY, authToken, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  })
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  })
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_KEY)
  await SecureStore.deleteItemAsync(REFRESH_KEY)
}
