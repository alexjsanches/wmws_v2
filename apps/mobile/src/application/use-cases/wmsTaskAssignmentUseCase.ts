import { postWmsTarefaAtribuir, postWmsTarefaDesatribuir } from '../../services/wmsApi'
import { DomainError } from '../DomainError'

export async function assignWmsTaskUseCase(params: {
  nutarefa: number
  codusuAtual?: number | null
}): Promise<void> {
  const { nutarefa, codusuAtual } = params
  if (!codusuAtual) {
    throw new DomainError('WMS_TASK_ASSIGN_USER_REQUIRED', 'Usuário sem CODUSU no perfil.')
  }
  await postWmsTarefaAtribuir(nutarefa, { codusu: codusuAtual })
}

export async function unassignWmsTaskUseCase(nutarefa: number): Promise<void> {
  await postWmsTarefaDesatribuir(nutarefa)
}
