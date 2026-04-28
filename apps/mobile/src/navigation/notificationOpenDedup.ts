let lastHandledOpenId: string | null = null

/** Evita navegar duas vezes para a mesma notificação (cold start + listener). */
export function consumeNotificationOpenOnce(identifier: string): boolean {
  if (lastHandledOpenId === identifier) return false
  lastHandledOpenId = identifier
  return true
}
