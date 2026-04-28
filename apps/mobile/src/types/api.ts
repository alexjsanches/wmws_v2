/** Resposta de POST /api/sessions/sankhya */
export type SankhyaLoginResponse = {
  authToken?: string
  refreshToken?: string
  token?: string
  data?: { authToken?: string; refreshToken?: string; token?: string }
}

/** Resposta de POST /api/refresh-mobile */
export type RefreshMobileResponse = {
  token?: string
  authToken?: string
  refreshToken?: string
}

export type ProfileResponse = Record<string, unknown> & {
  nomeusu?: string
  nome?: string
  email?: string
}
