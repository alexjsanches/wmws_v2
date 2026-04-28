import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authStorage from '../services/authStorage'
import { getProfile, postRefreshMobile, postSankhyaSession } from '../services/sessionApi'
import type { ProfileResponse } from '../types/api'
import { extractApiErrorMessage } from '../utils/extractApiErrorMessage'

type AuthContextValue = {
  user: ProfileResponse | null
  loading: boolean
  isAuthenticated: boolean
  login: (usuario: string, senha: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const hydrate = useCallback(async () => {
    setLoading(true)
    try {
      let token = await authStorage.getAuthToken()
      if (!token) {
        setUser(null)
        return
      }

      let res = await getProfile(token)
      if (res.status === 401) {
        const rt = await authStorage.getRefreshToken()
        if (!rt) {
          await authStorage.clearTokens()
          setUser(null)
          return
        }
        try {
          const next = await postRefreshMobile(rt)
          await authStorage.setTokens(next.authToken, next.refreshToken)
          token = next.authToken
          res = await getProfile(token)
        } catch {
          await authStorage.clearTokens()
          setUser(null)
          return
        }
      }

      if (!res.ok) {
        await authStorage.clearTokens()
        setUser(null)
        return
      }

      const profile = (await res.json()) as ProfileResponse
      setUser(profile)
    } catch {
      await authStorage.clearTokens()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const login = useCallback(async (usuario: string, senha: string) => {
    const tokens = await postSankhyaSession(usuario.trim(), senha)
    await authStorage.setTokens(tokens.authToken, tokens.refreshToken)
    const res = await getProfile(tokens.authToken)
    const bodyText = await res.text().catch(() => '')
    if (!res.ok) {
      await authStorage.clearTokens()
      let parsed: unknown = {}
      try {
        parsed = bodyText ? JSON.parse(bodyText) : {}
      } catch {
        parsed = {}
      }
      throw new Error(extractApiErrorMessage(res.status, bodyText, parsed))
    }
    let profile: ProfileResponse
    try {
      profile = (bodyText ? JSON.parse(bodyText) : {}) as ProfileResponse
    } catch {
      await authStorage.clearTokens()
      throw new Error('Resposta do perfil inválida.')
    }
    setUser(profile)
  }, [])

  const logout = useCallback(async () => {
    await authStorage.clearTokens()
    setUser(null)
  }, [])

  const refreshSession = useCallback(async () => {
    await hydrate()
  }, [hydrate])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      login,
      logout,
      refreshSession,
    }),
    [user, loading, login, logout, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }
  return ctx
}
