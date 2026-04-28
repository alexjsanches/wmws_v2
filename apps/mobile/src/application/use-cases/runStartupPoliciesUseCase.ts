import { checkForUpdate } from '../../services/updateChecker'

export type StartupPoliciesResult = {
  shutdown: boolean
  shutdownMessage?: string
}

/**
 * Caso de uso: executar políticas remotas no boot (update obrigatório / shutdown).
 */
export async function runStartupPoliciesUseCase(): Promise<StartupPoliciesResult> {
  const update = await checkForUpdate()
  if (update.shutdown) {
    return { shutdown: true, shutdownMessage: update.shutdownMessage }
  }
  return { shutdown: false }
}
