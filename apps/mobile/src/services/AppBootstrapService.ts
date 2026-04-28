import { runStartupPoliciesUseCase } from '../application/use-cases'
import { logger } from './logger'

export type AppBootstrapState = {
  shutdown: boolean
  shutdownMessage?: string
  updateAvailable: boolean
  mandatory?: boolean
  latestVersion?: string
  currentVersion?: string
  changelog?: string
  downloadUrl?: string
}

/**
 * Orquestra verificações de startup em sequência.
 * Mantém o App.tsx enxuto e facilita evoluir novos checks.
 */
export async function runAppBootstrap(): Promise<AppBootstrapState> {
  try {
    const policies = await runStartupPoliciesUseCase()
    if (policies.shutdown) {
      return { shutdown: true, shutdownMessage: policies.shutdownMessage, updateAvailable: false }
    }
    return policies
  } catch (e) {
    logger.warn('Falha no bootstrap inicial do app.', e)
  }
  return { shutdown: false, updateAvailable: false }
}
