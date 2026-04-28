/**
 * Extrai a mensagem de erro enviada pelo backend (Sankhya, Fastify, etc.)
 * a partir do status, do texto bruto e do JSON já parseado (se houver).
 */
export function extractApiErrorMessage(
  statusCode: number,
  responseText: string,
  parsedJson: unknown,
): string {
  const tryFromObject = (obj: Record<string, unknown>): string | null => {
    const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)

    const m = str(obj.message)
    if (m) return m

    const msgArr = obj.message
    if (Array.isArray(msgArr)) {
      const parts = msgArr
        .map((x) => (typeof x === 'string' ? x : typeof x === 'object' ? JSON.stringify(x) : String(x)))
        .filter((s) => s.length > 0)
      if (parts.length) return parts.join('; ')
    }

    for (const key of ['msg', 'errorMessage', 'description', 'detail', 'reason', 'erro']) {
      const v = str(obj[key])
      if (v) return v
    }

    const errStr = str(obj.error)
    if (errStr && errStr !== 'Internal Server Error' && errStr !== 'Bad Request') {
      return errStr
    }

    if (obj.data && typeof obj.data === 'object' && obj.data !== null) {
      const nested = tryFromObject(obj.data as Record<string, unknown>)
      if (nested) return nested
    }

    if (obj.error && typeof obj.error === 'object' && obj.error !== null) {
      const nested = tryFromObject(obj.error as Record<string, unknown>)
      if (nested) return nested
    }

    return null
  }

  if (parsedJson && typeof parsedJson === 'object' && parsedJson !== null) {
    const fromParsed = tryFromObject(parsedJson as Record<string, unknown>)
    if (fromParsed) return fromParsed
  }

  const raw = responseText.trim()
  if (raw && !raw.startsWith('<')) {
    try {
      const j = JSON.parse(raw) as unknown
      if (j && typeof j === 'object' && j !== null) {
        const fromJ = tryFromObject(j as Record<string, unknown>)
        if (fromJ) return fromJ
      }
    } catch {
      return raw.slice(0, 800)
    }
  }

  if (raw && !raw.startsWith('<')) {
    return raw.slice(0, 800)
  }

  return statusCode ? `HTTP ${statusCode}` : 'Erro desconhecido'
}
