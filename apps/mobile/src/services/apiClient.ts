import { API_BASE_URL } from '../config/env'
import { extractApiErrorMessage } from '../utils/extractApiErrorMessage'
import * as authStorage from './authStorage'
import { beginApiMutation, endApiMutation } from './apiActivity'
import { postRefreshMobile } from './sessionApi'

let refreshMutex: Promise<boolean> | null = null

async function runRefresh(): Promise<boolean> {
  const rt = await authStorage.getRefreshToken()
  if (!rt) {
    await authStorage.clearTokens()
    return false
  }
  try {
    const { authToken, refreshToken } = await postRefreshMobile(rt)
    await authStorage.setTokens(authToken, refreshToken)
    return true
  } catch {
    await authStorage.clearTokens()
    return false
  }
}

/**
 * Fetch autenticado: envia Bearer, trata 401 com POST /api/refresh-mobile uma vez e repete o pedido.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = API_BASE_URL.replace(/\/$/, '')
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`

  const doFetch = async (token: string | null) => {
    const h = new Headers(init.headers)
    if (init.body !== undefined && !h.has('Content-Type')) {
      h.set('Content-Type', 'application/json')
    }
    h.set('Accept', 'application/json')
    h.set('ngrok-skip-browser-warning', 'true')
    if (token) {
      h.set('Authorization', `Bearer ${token}`)
    }
    return fetch(url, { ...init, headers: h })
  }

  const method = String(init.method ?? 'GET').toUpperCase()
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method)
  if (isMutation) beginApiMutation()

  let token = await authStorage.getAuthToken()
  try {
    let res = await doFetch(token)

    if (res.status === 401) {
      if (!refreshMutex) {
        refreshMutex = runRefresh().finally(() => {
          refreshMutex = null
        })
      }
      const ok = await refreshMutex
      if (ok) {
        token = await authStorage.getAuthToken()
        res = await doFetch(token)
      }
    }

    return res
  } finally {
    if (isMutation) endApiMutation()
  }
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init)
  const text = await res.text()
  let data: unknown = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    throw new Error(extractApiErrorMessage(res.status, text, data))
  }
  return data as T
}
