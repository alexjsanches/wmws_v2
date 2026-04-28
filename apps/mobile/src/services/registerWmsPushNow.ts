import { registerPushDeviceUseCase } from '../application/use-cases'

export type RegisterWmsPushResult = { ok: true; token: string } | { ok: false; reason: string }

/** Pede permissão, obtém token Expo e envia para o backend (JWT). */
export async function registerWmsPushNow(): Promise<RegisterWmsPushResult> {
  return registerPushDeviceUseCase()
}
