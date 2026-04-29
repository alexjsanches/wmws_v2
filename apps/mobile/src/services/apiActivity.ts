let pendingRequests = 0
let pendingMutations = 0
const requestListeners = new Set<(count: number) => void>()
const mutationListeners = new Set<(count: number) => void>()

function emitRequests() {
  for (const l of requestListeners) l(pendingRequests)
}

function emitMutations() {
  for (const l of mutationListeners) l(pendingMutations)
}

export function beginApiRequest() {
  pendingRequests += 1
  emitRequests()
}

export function endApiRequest() {
  pendingRequests = Math.max(0, pendingRequests - 1)
  emitRequests()
}

export function beginApiMutation() {
  pendingMutations += 1
  emitMutations()
}

export function endApiMutation() {
  pendingMutations = Math.max(0, pendingMutations - 1)
  emitMutations()
}

export function subscribeApiRequests(listener: (count: number) => void) {
  requestListeners.add(listener)
  listener(pendingRequests)
  return () => {
    requestListeners.delete(listener)
  }
}

export function subscribeApiMutations(listener: (count: number) => void) {
  mutationListeners.add(listener)
  listener(pendingMutations)
  return () => {
    mutationListeners.delete(listener)
  }
}
