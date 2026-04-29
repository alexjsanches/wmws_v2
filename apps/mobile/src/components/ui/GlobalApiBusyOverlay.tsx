import { useEffect, useState } from 'react'
import { subscribeApiRequests } from '../../services/apiActivity'
import { SnkLoadingBar } from './SnkLoadingBar'

export function GlobalApiBusyOverlay() {
  const [count, setCount] = useState(0)

  useEffect(() => subscribeApiRequests(setCount), [])

  if (count <= 0) return null

  return <SnkLoadingBar loading mode="indeterminate" />
}
