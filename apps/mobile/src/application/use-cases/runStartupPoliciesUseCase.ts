import { checkForUpdate } from '../../services/updateChecker'

export type StartupPoliciesResult = {
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
 * Caso de uso: executar políticas remotas no boot (update obrigatório / shutdown).
 */
export async function runStartupPoliciesUseCase(): Promise<StartupPoliciesResult> {
  const update = await checkForUpdate()
  if (update.shutdown) {
    return { shutdown: true, shutdownMessage: update.shutdownMessage, updateAvailable: false }
  }
  return update
}
