import { API_BASE_URL } from '../config/env'
import type { ProfileResponse, RefreshMobileResponse, SankhyaLoginResponse } from '../types/api'
import { extractApiErrorMessage } from '../utils/extractApiErrorMessage'

const JSON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'ngrok-skip-browser-warning': 'true',
}

function joinUrl(path: string) {
  const base = API_BASE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

function unwrapTokens(body: SankhyaLoginResponse | RefreshMobileResponse): {
  authToken: string
  refreshToken: string
} | null {
  const auth =
    ('authToken' in body && body.authToken) ||
    ('token' in body && body.token) ||
    (body as SankhyaLoginResponse).data?.authToken ||
    (body as SankhyaLoginResponse).data?.token
  const refresh =
    ('refreshToken' in body && body.refreshToken) || (body as SankhyaLoginResponse).data?.refreshToken
  if (auth && refresh) {
    return { authToken: auth, refreshToken: refresh }
  }
  return null
}

export async function postSankhyaSession(usuario: string, senha: string) {
  const res = await fetch(joinUrl('/api/sessions/sankhya'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ usuario, senha }),
  })
  const text = await res.text()
  let json: SankhyaLoginResponse = {}
  try {
    json = text ? (JSON.parse(text) as SankhyaLoginResponse) : {}
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(extractApiErrorMessage(res.status, text, json))
  }
  const tokens = unwrapTokens(json)
  if (!tokens) {
    throw new Error('Resposta do servidor sem tokens de autenticação.')
  }
  return tokens
}

export async function postRefreshMobile(refreshToken: string) {
  const res = await fetch(joinUrl('/api/refresh-mobile'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ refreshToken }),
  })
  const text = await res.text()
  let json: RefreshMobileResponse = {}
  try {
    json = text ? (JSON.parse(text) as RefreshMobileResponse) : {}
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(extractApiErrorMessage(res.status, text, json))
  }
  const auth = json.token ?? json.authToken
  const refresh = json.refreshToken
  if (!auth || !refresh) {
    throw new Error('Resposta inválida ao renovar sessão.')
  }
  return { authToken: auth, refreshToken: refresh }
}

export async function getProfile(authToken: string) {
  return fetch(joinUrl('/api/profile'), {
    method: 'GET',
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${authToken}`,
    },
  })
}
