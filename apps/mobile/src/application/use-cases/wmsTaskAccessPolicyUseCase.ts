export function canOpenWmsTaskForUser(params: { taskOwnerCodusu?: number | null; currentCodusu?: number | null }): boolean {
  const owner = params.taskOwnerCodusu ?? 0
  const current = params.currentCodusu ?? 0
  if (owner <= 0) return true
  return owner === current
}
