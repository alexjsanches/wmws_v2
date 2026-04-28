type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function shouldLog(level: LogLevel): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true
  return level === 'warn' || level === 'error'
}

function print(level: LogLevel, message: string, extra?: unknown): void {
  if (!shouldLog(level)) return
  const tag = `[WMS/${level.toUpperCase()}] ${message}`
  if (level === 'error') {
    console.error(tag, extra ?? '')
    return
  }
  if (level === 'warn') {
    console.warn(tag, extra ?? '')
    return
  }
  console.log(tag, extra ?? '')
}

export const logger = {
  debug(message: string, extra?: unknown) {
    print('debug', message, extra)
  },
  info(message: string, extra?: unknown) {
    print('info', message, extra)
  },
  warn(message: string, extra?: unknown) {
    print('warn', message, extra)
  },
  error(message: string, extra?: unknown) {
    print('error', message, extra)
  },
}
