export type DomainErrorCode =
  | 'RECEBIMENTO_TASK_REQUIRED'
  | 'RECEBIMENTO_QTY_INVALID'
  | 'SEPARACAO_ENDERECO_REQUIRED'
  | 'ARMAZENAGEM_QTY_INVALID'
  | 'WMS_TASK_ASSIGN_USER_REQUIRED'

export class DomainError extends Error {
  code: DomainErrorCode

  constructor(code: DomainErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'DomainError'
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError
}
