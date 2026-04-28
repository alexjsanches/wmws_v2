let pendingMutations = 0
const listeners = new Set<(count: number) => void>()

function emit() {
  for (const l of listeners) l(pendingMutations)
}

export function beginApiMutation() {
  pendingMutations += 1
  emit()
}

export function endApiMutation() {
  pendingMutations = Math.max(0, pendingMutations - 1)
  emit()
}

export function subscribeApiMutations(listener: (count: number) => void) {
  listeners.add(listener)
  listener(pendingMutations)
  return () => {
    listeners.delete(listener)
  }
}
