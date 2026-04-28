import type { HomeStackParamList } from './types'
import { navigationRef } from './navigationRef'

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = parseInt(v, 10)
    if (!Number.isNaN(n)) return n
  }
  return undefined
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : v != null ? String(v) : ''
}

/**
 * Interpreta `data` do push (Expo) e navega no stack Início.
 * Convenções: `nutarefa`, `nunota`, `codemp`, `type` (ex.: separacao, conferencia, armazenagem, recebimento), `screen` (opcional).
 */
export function applyWmsNotificationData(raw: Record<string, unknown> | undefined | null): void {
  if (!raw || !navigationRef.isReady()) return

  const nutarefa = num(raw.nutarefa)
  const nunota = num(raw.nunota)
  const codemp = num(raw.codemp) ?? 1
  const type = str(raw.type).toLowerCase()
  const screenHint = str(raw.screen).toLowerCase()

  let payload: { screen: keyof HomeStackParamList; params?: HomeStackParamList[keyof HomeStackParamList] } | null =
    null

  if (nutarefa != null && nunota != null) {
    if (type.includes('conf') || screenHint.includes('confer')) {
      payload = {
        screen: 'ConferenciaTarefaItens',
        params: { nutarefa, nunota, numnota: str(raw.numnota) || undefined },
      }
    } else if (type.includes('receb')) {
      payload = {
        screen: 'RecebimentoNotaItens',
        params: { nunota, codemp, nutarefa },
      }
    } else {
      payload = {
        screen: 'SeparacaoTarefaItens',
        params: { nutarefa, nunota, numnota: str(raw.numnota) || undefined, codonda: num(raw.codonda) },
      }
    }
  }

  if (!payload && nutarefa != null) {
    if (type.includes('armaz')) {
      payload = { screen: 'ArmazenagemTarefaItens', params: { nutarefa } }
    }
  }

  if (payload) {
    navigationRef.navigate('Home', {
      screen: payload.screen,
      params: payload.params as never,
    })
    return
  }

  navigationRef.navigate('Home', { screen: 'Dashboard' })
}
